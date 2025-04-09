import React, { useEffect, useState } from 'react';

function ChatWindow({ chatId }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    // Создаем WebSocket-соединение
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${chatId}/`);
    ws.onopen = () => console.log('WebSocket соединение установлено');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data.message]);
    };
    ws.onerror = (error) => console.error('WebSocket ошибка:', error);
    ws.onclose = () => console.log('WebSocket соединение закрыто');
    setSocket(ws);
    // Закрытие соединения при размонтировании
    return () => ws.close();
  }, [chatId]);

  const sendMessage = () => {
    if (socket && messageInput) {
      const data = { message: messageInput };
      socket.send(JSON.stringify(data));
      setMessageInput('');
    }
  };

  return (
    <div>
      <h2>Чат {chatId}</h2>
      <div style={{ border: '1px solid gray', padding: '10px', height: '300px', overflowY: 'scroll' }}>
        {messages.map((msg, i) => (<p key={i}>{msg}</p>))}
      </div>
      <input
        type="text"
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        placeholder="Введите сообщение..."
      />
      <button onClick={sendMessage}>Отправить</button>
    </div>
  );
}

export default ChatWindow;
