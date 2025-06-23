import { Suspense } from "react"
import ChatInterface from "./chat-interface"

function ChatPageContent() {
  return <ChatInterface />
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}
