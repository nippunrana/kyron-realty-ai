#!/usr/bin/env python3
"""
Kyron Realty AI — Real-Time Telephony Audio Bridge
Bridges Twilio Media Streams (8kHz G.711 mu-law) with Agora SD-RTN RTC channels (UID 888).
Facilitates seamless 3-way conference between website prospect tenant, Sarah AI, and dialed property manager.
"""

import os
import sys
import json
import base64
import asyncio
import logging
import requests
import audioop

from agora.rtc.agora_service import (
    AgoraService,
    AgoraServiceConfig,
    RTCConnConfig,
    AreaCode,
    ChannelProfileType,
    AudioScenarioType,
)
from agora.rtc.agora_base import (
    RtcConnectionPublishConfig,
    ClientRoleType,
    AudioFramePosition,
)
from agora.rtc.audio_frame_observer import (
    IAudioFrameObserver,
    AudioParams,
    AudioFrame,
)
from agora.rtc.rtc_connection_observer import IRTCConnectionObserver
from agora.rtc.local_user_observer import IRTCLocalUserObserver

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [Telephony Bridge] %(message)s",
)
logger = logging.getLogger("telephony_bridge")

# --- Load Environment Variables ---
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
env_vars = {}
if os.path.exists(ENV_PATH):
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("\"'")
                env_vars[k] = v

APP_ID = env_vars.get("AGORA_APP_ID") or os.environ.get("AGORA_APP_ID", "")
BASE_PATH = env_vars.get("BASE_PATH", "/projects/kyron-realty-ai")
NEXT_INTERNAL_PORT = env_vars.get("PORT", "3000")
WS_PORT = int(os.environ.get("BRIDGE_PORT", "3005"))
MANAGER_RTC_UID = 888

if not APP_ID:
    logger.error("Missing AGORA_APP_ID in .env or environment!")
    sys.exit(1)

# --- Global Agora Service Instance (1 per process) ---
service_config = AgoraServiceConfig(
    appid=APP_ID,
    area_code=AreaCode.AREA_CODE_GLOB.value,
    channel_profile=ChannelProfileType.CHANNEL_PROFILE_LIVE_BROADCASTING,
    audio_scenario=AudioScenarioType.AUDIO_SCENARIO_DEFAULT,
    enable_audio_processor=1,
    enable_audio_device=0,
)
agora_service = AgoraService()
init_res = agora_service.initialize(service_config)
logger.info(f"AgoraService initialized globally (result={init_res})")


def notify_nextjs_event(event_type: str, channel_name: str, property_id: int, stream_sid: str, call_sid: str):
    """Sends webhook callback to Next.js API so Sarah updates her prompt & announces status."""
    url = f"http://127.0.0.1:{NEXT_INTERNAL_PORT}{BASE_PATH}/api/agora/telephony/bridge-event"
    payload = {
        "event": event_type,
        "channelName": channel_name,
        "propertyId": property_id,
        "streamSid": stream_sid,
        "callSid": call_sid,
    }
    try:
        resp = requests.post(url, json=payload, timeout=3)
        logger.info(f"Notified Next.js ({event_type}) for channel={channel_name}: status={resp.status_code}")
    except Exception as e:
        logger.warning(f"Failed to notify Next.js ({event_type}): {e}")


class ChannelAudioObserver(IAudioFrameObserver):
    """Receives playback audio from Agora channel and feeds it into the WebSocket queue."""

    def __init__(self, queue: asyncio.Queue, loop: asyncio.AbstractEventLoop):
        super().__init__()
        self.queue = queue
        self.loop = loop
        self.playback_count = 0
        self.before_mixing_count = 0
        self._pre_mix_buffers = {}

    def on_get_audio_frame_position(self, agora_local_user):
        """Specifies that we observe both mixed channel playback and per-user decoded frames."""
        return (
            AudioFramePosition.AUDIO_FRAME_POSITION_PLAYBACK.value
            | AudioFramePosition.AUDIO_FRAME_POSITION_BEFORE_MIXING.value
        )

    def on_playback_audio_frame(self, agora_local_user, channel_id, frame: AudioFrame):
        try:
            raw_pcm = bytes(frame.buffer)
            if not raw_pcm:
                return 1

            self.playback_count += 1
            if self.playback_count <= 5 or self.playback_count % 250 == 0:
                logger.info(
                    f"[Agora -> Twilio Mixed] Frame #{self.playback_count}: "
                    f"rate={frame.samples_per_sec}, channels={frame.channels}, bytes={len(raw_pcm)}"
                )

            # Convert to mono if multi-channel
            if frame.channels > 1:
                raw_pcm = audioop.tomono(raw_pcm, 2, 0.5, 0.5)

            # Resample to 8000Hz for Twilio if needed
            if frame.samples_per_sec != 8000:
                raw_pcm, _ = audioop.ratecv(raw_pcm, 2, 1, frame.samples_per_sec, 8000, None)

            # Convert 16-bit linear PCM (8kHz) to 8kHz mu-law
            ulaw_chunk = audioop.lin2ulaw(raw_pcm, 2)
            if not self.queue.full():
                self.loop.call_soon_threadsafe(self.queue.put_nowait, ulaw_chunk)
        except Exception as e:
            logger.warning(f"Error in on_playback_audio_frame: {e}")
        return 1

    def on_playback_audio_frame_before_mixing(
        self, agora_local_user, channel_id, uid, frame: AudioFrame, vad_result_state: int, vad_result_bytearray: bytearray
    ):
        try:
            # If mixed playback frames are already arriving, skip per-user pre-mix frames to prevent duplication
            if self.playback_count > 0:
                return 1

            # Ignore audio from ourselves (UID 888)
            if str(uid) == str(MANAGER_RTC_UID):
                return 1

            raw_pcm = bytes(frame.buffer)
            if not raw_pcm:
                return 1

            self.before_mixing_count += 1
            if self.before_mixing_count <= 5 or self.before_mixing_count % 250 == 0:
                logger.info(
                    f"[Agora -> Twilio Pre-Mix] uid={uid} Frame #{self.before_mixing_count}: "
                    f"rate={frame.samples_per_sec}, channels={frame.channels}, bytes={len(raw_pcm)}"
                )

            if frame.channels > 1:
                raw_pcm = audioop.tomono(raw_pcm, 2, 0.5, 0.5)

            if frame.samples_per_sec != 8000:
                raw_pcm, _ = audioop.ratecv(raw_pcm, 2, 1, frame.samples_per_sec, 8000, None)

            # Accumulate 10ms chunks (160 bytes) into 20ms chunks (320 bytes) for Twilio
            buf = self._pre_mix_buffers.get(uid, bytearray())
            buf += raw_pcm
            if len(buf) >= 320:
                pcm_chunk = bytes(buf[:320])
                self._pre_mix_buffers[uid] = buf[320:]
                ulaw_chunk = audioop.lin2ulaw(pcm_chunk, 2)
                if not self.queue.full():
                    self.loop.call_soon_threadsafe(self.queue.put_nowait, ulaw_chunk)
            else:
                self._pre_mix_buffers[uid] = buf
        except Exception as e:
            logger.warning(f"Error in on_playback_audio_frame_before_mixing: {e}")
        return 1

    def on_get_playback_audio_frame_param(self, agora_local_user) -> AudioParams:
        return AudioParams(sample_rate=8000, channels=1, mode=0, samples_per_call=160)


class ChannelConnectionObserver(IRTCConnectionObserver):
    """Monitors Agora connection lifecycle."""

    def __init__(self, rtc_conn=None):
        super().__init__()
        self.rtc_conn = rtc_conn

    def on_connected(self, agora_rtc_conn, conn_info, reason):
        logger.info(f"[Agora Connection] Successfully joined channel as UID {MANAGER_RTC_UID}")
        if self.rtc_conn:
            try:
                ret = self.rtc_conn.publish_audio()
                logger.info(f"[Agora Connection] Published audio track on connect (result={ret})")
            except Exception as e:
                logger.warning(f"[Agora Connection] Error publishing audio on connect: {e}")

    def on_disconnected(self, agora_rtc_conn, conn_info, reason):
        logger.info("[Agora Connection] Disconnected from Agora channel")

    def on_connection_failure(self, agora_rtc_conn, conn_info, reason):
        logger.error(f"[Agora Connection] Connection failed: {reason}")

    def on_aiqos_capability_missing(self, agora_rtc_conn, default_scenario):
        """Prevents TypeError in Agora SDK capabilities callback."""
        return -1


class ChannelLocalUserObserver(IRTCLocalUserObserver):
    """Monitors Agora local user audio publishing and remote user subscriptions."""

    def on_audio_track_publish_success(self, agora_local_user, audio_track):
        logger.info("[Agora LocalUser] Local audio track successfully published to channel!")

    def on_audio_track_publication_failure(self, agora_local_user, audio_track, error):
        logger.error(f"[Agora LocalUser] Local audio track publish failed: {error}")

    def on_user_audio_track_subscribed(self, agora_local_user, user_id, agora_remote_audio_track):
        logger.info(f"[Agora LocalUser] Subscribed to remote user audio track: user_id={user_id}")

    def on_first_remote_audio_frame(self, agora_local_user, user_id, elapsed):
        logger.info(f"[Agora LocalUser] First remote audio frame received from user_id={user_id}, elapsed={elapsed}ms")


async def twilio_audio_sender(websocket, stream_sid: str, queue: asyncio.Queue, stop_event: asyncio.Event):
    """Pulls mu-law audio chunks from queue and sends them as Twilio media messages."""
    sent_count = 0
    try:
        while not stop_event.is_set():
            try:
                chunk = await asyncio.wait_for(queue.get(), timeout=0.1)
                b64_payload = base64.b64encode(chunk).decode("ascii")
                msg = {
                    "event": "media",
                    "streamSid": stream_sid,
                    "media": {
                        "payload": b64_payload,
                    },
                }
                await websocket.send(json.dumps(msg))
                sent_count += 1
                if sent_count <= 5 or sent_count % 250 == 0:
                    logger.info(f"[Twilio Sender] Sent {sent_count} audio packets to Twilio (streamSid={stream_sid})")
            except asyncio.TimeoutError:
                continue
    except Exception as e:
        logger.info(f"Twilio audio sender ended: {e}")


async def handle_twilio_stream(websocket):
    """Handles an individual Twilio Media Stream connection."""
    client_ip = websocket.remote_address[0] if websocket.remote_address else "unknown"
    logger.info(f"New connection from {client_ip} on path {websocket.request.path if hasattr(websocket, 'request') else 'ws'}")

    loop = asyncio.get_running_loop()
    audio_queue = asyncio.Queue(maxsize=200)
    stop_event = asyncio.Event()

    stream_sid = None
    call_sid = None
    channel_name = None
    property_id = 0
    token = None

    rtc_conn = None
    sender_task = None
    media_in_count = 0

    try:
        async for raw_message in websocket:
            try:
                data = json.loads(raw_message)
            except Exception:
                continue

            event = data.get("event")

            if event == "connected":
                logger.info("Twilio Media Stream protocol handshake: connected")

            elif event == "start":
                start_info = data.get("start", {})
                stream_sid = start_info.get("streamSid") or data.get("streamSid")
                call_sid = start_info.get("callSid")
                custom_params = start_info.get("customParameters", {})

                channel_name = custom_params.get("channelName")
                token = custom_params.get("token")
                try:
                    property_id = int(custom_params.get("propertyId") or "0")
                except ValueError:
                    property_id = 0

                logger.info(
                    f"Twilio stream started: streamSid={stream_sid}, callSid={call_sid}, "
                    f"channel={channel_name}, propertyId={property_id}"
                )

                if not channel_name or not token:
                    logger.error("Missing channelName or token in stream customParameters!")
                    break

                # 1. Create Agora RTC Connection with audio recording & playout enabled
                conn_config = RTCConnConfig(
                    client_role_type=ClientRoleType.CLIENT_ROLE_BROADCASTER,
                    channel_profile=ChannelProfileType.CHANNEL_PROFILE_LIVE_BROADCASTING,
                    auto_subscribe_audio=1,
                    auto_subscribe_video=0,
                    enable_audio_recording_or_playout=1,
                )
                pub_config = RtcConnectionPublishConfig(
                    is_publish_audio=True,
                    is_publish_video=False,
                    audio_scenario=AudioScenarioType.AUDIO_SCENARIO_DEFAULT,
                )
                rtc_conn = agora_service.create_rtc_connection(conn_config, pub_config)

                # 2. Register Connection and LocalUser Observers
                conn_observer = ChannelConnectionObserver(rtc_conn)
                rtc_conn.register_observer(conn_observer)

                local_user_observer = ChannelLocalUserObserver()
                rtc_conn.local_user._register_local_user_observer(local_user_observer)

                # 3. Configure audio frame playback format & subscribe to channel audio BEFORE registering frame observer
                rtc_conn.local_user.set_playback_audio_frame_before_mixing_parameters(1, 8000)
                rtc_conn.local_user.set_playback_audio_frame_parameters(1, 8000, 0, 160)
                rtc_conn.local_user.subscribe_all_audio()

                # 4. Register Audio Frame Observer (listens to both playback and pre-mix positions)
                audio_observer = ChannelAudioObserver(audio_queue, loop)
                rtc_conn.register_audio_frame_observer(audio_observer, 0, None)

                # 5. Connect to channel as UID 888 and publish audio track
                ret = rtc_conn.connect(token, channel_name, str(MANAGER_RTC_UID))
                pub_ret = rtc_conn.publish_audio()
                logger.info(
                    f"Joined Agora channel={channel_name} as UID={MANAGER_RTC_UID} "
                    f"(connect_ret={ret}, pub_ret={pub_ret})"
                )

                # 6. Start background sender task to stream Agora audio back to Twilio
                sender_task = asyncio.create_task(
                    twilio_audio_sender(websocket, stream_sid, audio_queue, stop_event)
                )

                # 7. Notify Next.js server so Sarah announces manager arrival & enters Observer Mode
                notify_nextjs_event("connected", channel_name, property_id, stream_sid or "", call_sid or "")

            elif event == "media":
                if rtc_conn:
                    media_info = data.get("media", {})
                    payload = media_info.get("payload")
                    if payload:
                        try:
                            ulaw_bytes = base64.b64decode(payload)
                            # Convert 8kHz mu-law from phone to 16-bit linear PCM (8kHz, 1 channel)
                            pcm_bytes = audioop.ulaw2lin(ulaw_bytes, 2)
                            # Agora SDK's send_audio_pcm_data calls ctypes.from_buffer which requires
                            # a mutable buffer (bytearray), otherwise it raises TypeError: buffer is not writable
                            pcm_buffer = bytearray(pcm_bytes)
                            ret_push = rtc_conn.push_audio_pcm_data(pcm_buffer, 8000, 1)

                            media_in_count += 1
                            if media_in_count <= 5 or media_in_count % 250 == 0:
                                logger.info(
                                    f"[Twilio -> Agora] Pushed packet #{media_in_count}: "
                                    f"{len(pcm_buffer)} bytes, ret={ret_push}"
                                )
                        except Exception as pcm_err:
                            logger.error(f"Audio push error: {pcm_err}")

            elif event == "stop":
                logger.info(f"Twilio stream stop event received: streamSid={stream_sid}")
                break

    except Exception as e:
        logger.warning(f"Twilio stream handler error: {e}")

    finally:
        stop_event.set()
        if sender_task:
            sender_task.cancel()

        if rtc_conn:
            try:
                rtc_conn.unpublish_audio()
                rtc_conn.disconnect()
                rtc_conn.release()
                logger.info(f"Agora connection for channel={channel_name} released.")
            except Exception as e:
                logger.warning(f"Error releasing Agora connection: {e}")

        if channel_name:
            # Notify Next.js server so Sarah reverts to Sales Mode & follows up
            notify_nextjs_event("disconnected", channel_name, property_id, stream_sid or "", call_sid or "")

        logger.info(f"Cleaned up session for streamSid={stream_sid}")


async def main():
    import websockets
    logger.info(f"Starting Twilio-Agora Telephony Audio Bridge WebSocket server on 127.0.0.1:{WS_PORT}")
    async with websockets.serve(
        handle_twilio_stream,
        "127.0.0.1",
        WS_PORT,
        ping_interval=20,
        ping_timeout=20,
        max_size=2**20,
    ):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Telephony bridge shutting down...")
    finally:
        agora_service.release()
        logger.info("AgoraService released. Exit.")
