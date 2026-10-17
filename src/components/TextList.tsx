import { useApp } from "../appContext";
import { formatStamp } from "../data/dates";
import { MESSAGE_LABEL } from "../data/messages";
import type { Message } from "../data/types";

/** Customer texts as phone-style bubbles. */
function TextList({ messages, showJob = false }: { messages: Message[]; showJob?: boolean }) {
  const { client, openJob } = useApp();
  return (
    <ul className="text-list">
      {messages.map((message) => (
        <li key={message.id}>
          <div className="text-meta">
            <span className={`text-kind text-${message.kind}`}>{MESSAGE_LABEL[message.kind]}</span>
            <span>To {client(message.clientId)?.contactName ?? "customer"} · {message.to || "no phone"}</span>
            <span>{formatStamp(message.at)}</span>
            {showJob && <button className="inline-link" onClick={() => openJob(message.jobId)}>{message.jobId}</button>}
          </div>
          <p className="sms-bubble">{message.body}</p>
        </li>
      ))}
    </ul>
  );
}

export default TextList;
