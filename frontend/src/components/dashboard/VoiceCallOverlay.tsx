import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Socket } from "socket.io-client";

interface VoiceCallOverlayProps {
  socket: Socket | null;
  userId: string;
  userName: string;
  consultationId: string;
  recipientId: string;
  recipientName: string;
  consultationType: "CHAT" | "VOICE_CALL";
  onIncomingCall?: () => void;
}

export function VoiceCallOverlay({
  socket,
  userId,
  userName,
  consultationId,
  recipientId,
  recipientName,
  consultationType,
  onIncomingCall
}: VoiceCallOverlayProps) {
  const [callState, setCallState] = useState<"IDLE" | "CALLING" | "RINGING" | "ACTIVE">("IDLE");
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [incomingOffer, setIncomingOffer] = useState<any>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  // STUN servers configuration
  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };

  useEffect(() => {
    if (!socket) return;

    // Listen for incoming call
    const handleIncomingCall = (data: { offer: any, consultationId: string, callerName: string }) => {
      if (data.consultationId === consultationId) {
        setIncomingOffer(data.offer);
        setCallState("RINGING");
        toast.info(`Incoming voice call from ${data.callerName}`);
        if (onIncomingCall) {
          onIncomingCall();
        }
      }
    };

    // Listen for call answered
    const handleCallAnswered = async (data: { answer: any, consultationId: string }) => {
      if (data.consultationId === consultationId && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallState("ACTIVE");
          startTimer();
        } catch (err) {
          console.error("Error setting remote description", err);
          cleanupCall();
        }
      }
    };

    // Listen for ICE candidate
    const handleIceCandidate = async (data: { candidate: any, consultationId: string }) => {
      if (data.consultationId === consultationId && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error("Error adding ice candidate", err);
        }
      }
    };

    // Listen for call ended
    const handleCallEnded = (data: { consultationId: string }) => {
      if (data.consultationId === consultationId) {
        toast.info("Call ended by the other party.");
        cleanupCall();
      }
    };

    socket.on("call_incoming", handleIncomingCall);
    socket.on("call_answered", handleCallAnswered);
    socket.on("ice_candidate", handleIceCandidate);
    socket.on("call_ended", handleCallEnded);

    return () => {
      socket.off("call_incoming", handleIncomingCall);
      socket.off("call_answered", handleCallAnswered);
      socket.off("ice_candidate", handleIceCandidate);
      socket.off("call_ended", handleCallEnded);
      cleanupCall();
    };
  }, [socket, consultationId]);

  // Duration Timer
  const startTimer = () => {
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Peer Connection Setup helper
  const setupPeerConnection = async () => {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    // Get microphone stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;

    // Add local tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote track
    pc.ontrack = (event) => {
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    // ICE Candidate signaling
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice_candidate", {
          toUserId: recipientId,
          candidate: event.candidate,
          consultationId
        });
      }
    };

    return pc;
  };

  // Start Call (Caller side)
  const startCall = async () => {
    if (consultationType !== "VOICE_CALL") {
      toast.warning("Calling is only enabled for Voice Call consultations.");
      return;
    }

    try {
      setCallState("CALLING");
      const pc = await setupPeerConnection();

      // Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Signal Call to recipient
      if (socket) {
        socket.emit("call_user", {
          toUserId: recipientId,
          offer,
          consultationId,
          callerName: userName
        });
      }
    } catch (err) {
      console.error("Failed to start voice call:", err);
      toast.error("Could not access microphone for voice call.");
      cleanupCall();
    }
  };

  // Answer Call (Recipient side)
  const answerCall = async () => {
    if (!incomingOffer) return;

    try {
      const pc = await setupPeerConnection();

      // Set Remote Offer
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));

      // Create Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send Answer back
      if (socket) {
        socket.emit("answer_call", {
          toUserId: recipientId,
          answer,
          consultationId
        });
      }

      setCallState("ACTIVE");
      startTimer();
    } catch (err) {
      console.error("Failed to answer voice call:", err);
      toast.error("Failed to setup connection for voice call.");
      cleanupCall();
    }
  };

  // Decline or End Call
  const endCall = () => {
    if (socket) {
      socket.emit("end_call", {
        toUserId: recipientId,
        consultationId
      });
    }
    cleanupCall();
  };

  // Local Mute Toggle
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Cleanup WebRTC resources
  const cleanupCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setCallState("IDLE");
    setDuration(0);
    setIncomingOffer(null);
  };

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay />

      {/* Trigger Button in Chat Toolbar */}
      {consultationType === "VOICE_CALL" && callState === "IDLE" && (
        <Button
          onClick={startCall}
          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-bold text-[10px] px-3.5 border-0 cursor-pointer shadow-sm rounded-lg"
        >
          <Phone className="h-3.5 w-3.5" /> Start Free Voice Call
        </Button>
      )}

      {/* Calling / Ringing / Active Screen Overlay */}
      {callState !== "IDLE" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-card/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full h-full flex flex-col items-center justify-center space-y-6 text-foreground relative overflow-hidden">
            {/* Visual background pulse effect */}
            <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none animate-pulse" />

            <div className="flex flex-col items-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-emerald-600/10 flex items-center justify-center border border-emerald-500/20 relative">
                <span className="absolute inset-0 rounded-full border border-emerald-500 animate-ping opacity-25" />
                <Phone className={`h-8 w-8 text-emerald-600 ${callState === "CALLING" || callState === "RINGING" ? "animate-bounce" : ""}`} />
              </div>

              <div>
                <h3 className="text-lg font-bold tracking-tight">{recipientName}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {callState === "CALLING" && "Calling..."}
                  {callState === "RINGING" && "Incoming Voice Call..."}
                  {callState === "ACTIVE" && `In Call — ${formatDuration(duration)}`}
                </p>
              </div>
            </div>

            {/* In-Call Controls */}
            <div className="flex items-center justify-center gap-4 pt-4">
              {callState === "RINGING" ? (
                <>
                  <Button
                    onClick={answerCall}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 w-28 rounded-full border-0 cursor-pointer text-xs"
                  >
                    Answer
                  </Button>
                  <Button
                    onClick={endCall}
                    variant="destructive"
                    className="h-12 w-28 rounded-full font-bold cursor-pointer text-xs"
                  >
                    Decline
                  </Button>
                </>
              ) : (
                <>
                  {callState === "ACTIVE" && (
                    <Button
                      onClick={toggleMute}
                      variant="outline"
                      className={`h-11 w-11 rounded-full p-0 cursor-pointer border ${
                        isMuted ? "bg-red-50 text-red-500 border-red-200" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isMuted ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
                    </Button>
                  )}

                  <Button
                    onClick={endCall}
                    variant="destructive"
                    className="h-11 w-32 rounded-full font-bold gap-2 cursor-pointer text-xs"
                  >
                    <PhoneOff className="h-4.5 w-4.5" /> End Call
                  </Button>
                </>
              )}
            </div>

            <div className="text-[9px] text-muted-foreground flex items-center justify-center gap-1 opacity-70">
              <ShieldAlert className="h-3 w-3" /> Secure P2P Encryption Active
            </div>
          </div>
        </div>
      )}
    </>
  );
}
