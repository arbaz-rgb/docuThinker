import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import VoiceChatComposer from "../../components/ask/VoiceChatComposer";
import AiResponseRenderer from "../../components/ai/AiResponseRenderer";
import { askPdfQuestion } from "../../services/ai.service";

const getMessageTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const seedMessages = [
  {
    id: "ai-1",
    role: "ai",
    text: "I'm ready. Ask a question about this PDF and I'll answer from the document content.",
    time: getMessageTime(),
  },
];

const AskPdfPage = () => {
  const { documentId } = useParams();
  const bottomRef = useRef(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(seedMessages);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedInput = input.trim();

    if (!trimmedInput || isSending) {
      return;
    }

    const pendingMessageId = `ai-${Date.now()}`;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmedInput,
        time: getMessageTime(),
      },
      {
        id: pendingMessageId,
        role: "ai",
        text: "Reading the document and preparing an answer...",
        time: getMessageTime(),
        pending: true,
      },
    ]);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const data = await askPdfQuestion(documentId, trimmedInput);
      setDocumentTitle(data.document?.title || "");
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === pendingMessageId
            ? {
                ...message,
                text: data.result,
                pending: false,
              }
            : message
        )
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to answer this question right now."
      );
      setMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== pendingMessageId)
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="ask-pdf-page">
      <div className="ask-pdf-header">
        <div>
          <p className="section-label">Ask PDF</p>
          <h2>Document Chat</h2>
          <p className="muted">Selected document: {documentTitle || documentId}</p>
        </div>

        <div className="ask-pdf-meta">
          <span className="tag">Live chat</span>
          <span className="tag">Document grounded</span>
        </div>
      </div>

      <div className="chat-shell panel">
        {error ? <div className="status-alert error">{error}</div> : null}

        <div className="chat-window" role="log" aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`chat-message ${message.role === "user" ? "user" : "ai"}`}
            >
              <div className="chat-bubble">
                <div className="chat-bubble-meta">
                  <strong>{message.role === "user" ? "You" : "DocuThinker"}</strong>
                  <span>{message.pending ? "Thinking" : message.time}</span>
                </div>
                {message.role === "ai" && !message.pending ? (
                  <AiResponseRenderer text={message.text} compact />
                ) : (
                  <p>{message.text}</p>
                )}
              </div>
            </article>
          ))}
          <div ref={bottomRef} />
        </div>

        <VoiceChatComposer
          disabled={isSending}
          isSending={isSending}
          onSubmit={handleSubmit}
          onValueChange={setInput}
          value={input}
        />
      </div>
    </section>
  );
};

export default AskPdfPage;
