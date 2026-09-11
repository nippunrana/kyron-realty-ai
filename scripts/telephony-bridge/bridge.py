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
)
from agora.rtc.audio_frame_observer import (
    IAudioFrameObserver,
    AudioParams,
    AudioFrame,
)
from agora.rtc.rtc_connection_observer import IRTCConnectionObserver

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
    audio_scenario=AudioScenarioType.AUDIO_SCENARIO_AI_SERVER,
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
    """Receives mixed playback audio from Agora channel and feeds it into the WebSocket queue."""

    def __init__(self, queue: asyncio.Queue, loop: asyncio.AbstractEventLoop):
        super().__init__()
        self.queue = queue
        self.loop = loop

    def on_playback_audio_frame(self, agora_local_user, channel_id, frame: AudioFrame):
        try:
            raw_pcm = bytes(frame.buffer)
            if not raw_pcm:
                return 1
            # Convert 16-bit linear PCM (8kHz) to 8kHz mu-law
            ulaw_chunk = audioop.lin2ulaw(raw_pcm, 2)
            if not self.queue.full():
                self.loop.call_soon_threadsafe(self.queue.put_nowait, ulaw_chunk)
        except Exception:
            pass
        return 1

    def on_get_playback_audio_frame_param(self, agora_local_user) -> AudioParams:
        # Request 8000Hz mono audio with 160 samples (20ms) per frame to match Twilio exactly
        return AudioParams(sample_rate=8000, channels=1, mode=0, samples_per_call=160)


class ChannelConnectionObserver(IRTCConnectionObserver):
    """Monitors Agora connection lifecycle."""

    def on_connected(self, agora_rtc_conn, conn_info, reason):
        logger.info(f"[Agora Connection] Successfully joined channel as UID {MANAGER_RTC_UID}")

    def on_disconnected(self, agora_rtc_conn, conn_info, reason):
        logger.info("[Agora Connection] Disconnected from Agora channel")

    def on_connection_failure(self, agora_rtc_conn, conn_info, reason):
        logger.error(f"[Agora Connection] Connection failed: {reason}")


async def twilio_audio_sender(websocket, stream_sid: str, queue: asyncio.Queue, stop_event: asyncio.Event):
    """Pulls mu-law audio chunks from queue and sends them as Twilio media messages."""
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
            except asyncio.TimeoutError:
                continue
    except Exception as e:
        logger.info(f"Audio sender ended: {e}")


async def handle_twilio_stream(websocket):
    """Handles an individual Twilio Media Stream connection."""
    client_ip = websocket.remote_address[0] if websocket.remote_address else "unknown"
    logger.info(f"New connection from {client_ip} on path {websocket.request.path if hasattr(websocket, 'request') else 'ws'}")

    loop = asyncio.get_running_loop()
    audio_queue = asyncio.Queue(maxsize=100)
    stop_event = asyncio.Event()

    stream_sid = None
    call_sid = None
    channel_name = None
    property_id = 0
    token = None

    rtc_conn = None
    sender_task = None

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

                # 1. Create Agora RTC Connection
                conn_config = RTCConnConfig(
                    client_role_type=ClientRoleType.CLIENT_ROLE_BROADCASTER,
                    channel_profile=ChannelProfileType.CHANNEL_PROFILE_LIVE_BROADCASTING,
                    auto_subscribe_audio=1,
                    auto_subscribe_video=0,
                )
                pub_config = RtcConnectionPublishConfig(
                    is_publish_audio=True,
                    is_publish_video=False,
                )
                rtc_conn = agora_service.create_rtc_connection(conn_config, pub_config)

                # 2. Register Connection & Audio Observers
                conn_observer = ChannelConnectionObserver()
                rtc_conn.register_observer(conn_observer)

                audio_observer = ChannelAudioObserver(audio_queue, loop)
                rtc_conn.register_audio_frame_observer(audio_observer, 0, None)

                # 3. Connect to channel as UID 888 and publish audio
                ret = rtc_conn.connect(token, channel_name, str(MANAGER_RTC_UID))
                rtc_conn.publish_audio()
                logger.info(f"Joined Agora channel={channel_name} as UID={MANAGER_RTC_UID} (result={ret})")

                # 4. Start background sender task to stream Agora audio back to Twilio
                sender_task = asyncio.create_task(
                    twilio_audio_sender(websocket, stream_sid, audio_queue, stop_event)
                )

                # 5. Notify Next.js server so Sarah announces manager arrival & enters Observer Mode
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
                            # Push into Agora RTC
                            rtc_conn.push_audio_pcm_data(pcm_bytes, 8000, 1)
                        except Exception as pcm_err:
                            logger.debug(f"Audio push error: {pcm_err}")

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
