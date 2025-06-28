import { Suspense } from "react"
import AirlineChatInterface from "./airline-chat-interface"

function ChatPageContent() {
  return <AirlineChatInterface />
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}
