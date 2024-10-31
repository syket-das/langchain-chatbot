// @ts-nocheck
import { FC, useEffect, useRef, useState } from 'react';

import ChatHeader from './ChatHeader';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Message } from '@/types/chat';
import LoadingDots from './ui/LoadingDots';
import styles from '@/styles/Home.module.css';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { CornerDownLeft, Loader2, Mic2Icon } from 'lucide-react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { cn } from '@/utils/cn';
import { useSpeechSynthesis, useSpeechRecognition } from 'react-speech-kit';
import { Mic } from 'lucide-react';

const Chat: FC = () => {
  const { speak } = useSpeechSynthesis();

  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    phone: string;
  }>({
    name: '',
    email: '',
    phone: '',
  });

  let [promptShown, setPromptShown] = useState<boolean>(true);

  const { listen, listening, stop } = useSpeechRecognition({
    onResult: (result) => {
      setQuery(result);
    },
  });

  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message:
          'Hi, I am LPU AI. I can help you with your addmission queries. Ask me anything!',
        type: 'apiMessage',
      },
    ],
    history: [],
  });

  const { messages, history } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          history,
        }),
      });
      const data = await response.json();
      console.log('data', data);

      if (data.error) {
        setError(data.error);
      } else {
        setMessageState((state) => ({
          ...state,
          messages: [
            ...state.messages,
            {
              type: 'apiMessage',
              message: data.text,
              sourceDocs: data.sourceDocuments,
            },
          ],
          history: [...state.history, [question, data.text]],
        }));
      }
      console.log('messageState', messageState);

      setLoading(false);

      //scroll to bottom
      messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      console.log('error', error);
    }
  }

  //prevent empty submissions
  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);

      //scroll to bottom
      messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);

      handleUserDataUpdate();
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };

  const handleUserData = async () => {
    setPromptShown(false);

    const { name, email, phone } = userData;
    const metaData = {
      messages: messages,
      history: history,
    };

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          metaData,
        }),
      });
      const data = await response.json();

      if (data.user) {
        setMessageState((state) => ({
          ...state,
          messages: data.user.metaData.messages,
          history: data.user.metaData.history,
        }));
      }

      console.log('data', data);
    } catch (error) {
      alert('An error occurred while fetching the data. Please try again.');
    }
  };

  const handleUserDataUpdate = async () => {
    const { name, email, phone } = userData;
    const metaData = {
      messages: messages,
      history: history,
    };

    try {
      const response = await fetch('/api/userInfo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          metaData,
        }),
      });
      const data = await response.json();
    } catch (error) {
      alert('An error occurred while fetching the data. Please try again.');
    }
  };

  return (
    <Accordion
      type="single"
      collapsible
      className="relative bg-white z-40 shadow"
    >
      <AccordionItem value="item-1">
        <div className="fixed right-8 w-[380px] bottom-8 bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="w-full h-full flex flex-col">
            <AccordionTrigger className="px-6 border-b border-zinc-300">
              <ChatHeader listening={listening} />
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col h-[400px] ">
                <div ref={messageListRef} className={styles.messagelist}>
                  {messages.map((message, index) => {
                    let icon;
                    let className;

                    if (message.type === 'apiMessage') {
                      icon = (
                        <Image
                          key={index}
                          src="/bot-image.png"
                          alt="AI"
                          width="20"
                          height="20"
                          className={styles.boticon}
                          priority
                        />
                      );
                      className = styles.apimessage;
                    } else {
                      icon = (
                        <Image
                          key={index}
                          src="/usericon.png"
                          alt="Me"
                          width="20"
                          height="20"
                          className={styles.usericon}
                          priority
                        />
                      );
                      // The latest message sent by the user will be animated while waiting for a response
                      className =
                        loading && index === messages.length - 1
                          ? styles.usermessagewaiting
                          : styles.usermessage;
                    }

                    if (index === 0) {
                      return (
                        <>
                          <div
                            key={`chatMessage-${index}`}
                            className={className}
                          >
                            {icon}
                            <div className={styles.markdownanswer}>
                              <ReactMarkdown
                                linkTarget="_blank"
                                className="text-xs"
                              >
                                {message.message}
                              </ReactMarkdown>
                            </div>
                          </div>
                          {promptShown === true ? (
                            <div className="flex items-center justify-center text-gray-500 text-xs">
                              <div className="mx-auto w-[80%]">
                                <p>
                                  Please Enter your details to get better result
                                </p>
                                <input
                                  type="text"
                                  className="border border-gray-200 px-2 py-1 w-full mt-2"
                                  placeholder="Name"
                                  value={userData.name}
                                  onChange={(e) =>
                                    setUserData({
                                      ...userData,
                                      name: e.target.value,
                                    })
                                  }
                                />
                                <input
                                  type="text"
                                  className="border border-gray-200 px-2 py-1 w-full mt-2"
                                  placeholder="Email"
                                  value={userData.email}
                                  onChange={(e) =>
                                    setUserData({
                                      ...userData,
                                      email: e.target.value,
                                    })
                                  }
                                />
                                <input
                                  type="text"
                                  className="border border-gray-200 px-2 py-1 w-full mt-2"
                                  placeholder="Phone"
                                  value={userData.phone}
                                  onChange={(e) =>
                                    setUserData({
                                      ...userData,
                                      phone: e.target.value,
                                    })
                                  }
                                />
                                <div
                                  onClick={handleUserData}
                                  className="flex gap-2"
                                >
                                  <button className="bg-blue-500 text-white px-2 py-1 mt-2">
                                    Submit
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </>
                      );
                    } else {
                      return (
                        <>
                          <div
                            key={`chatMessage-${index}`}
                            className={className}
                          >
                            {icon}
                            <div className={styles.markdownanswer}>
                              <ReactMarkdown
                                linkTarget="_blank"
                                className="text-xs"
                              >
                                {message.message}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </>
                      );
                    }
                  })}
                </div>

                <div className={cn('border-t border-zinc-300 w-full ')}>
                  <div className="relative mt-4 flex-1 overflow-hidden rounded-lg border-none outline-none">
                    <ReactTextareaAutosize
                      onKeyDown={handleEnter}
                      disabled={loading}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      rows={2}
                      maxRows={4}
                      autoFocus
                      placeholder="Write a message..."
                      className="peer disabled:opacity-50 pr-14 resize-none block w-full  py-1.5 text-gray-900  text-sm sm:leading-6 min-h-full outline-none pl-2"
                    />

                    <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                      <button
                        disabled={loading}
                        onMouseDown={listen}
                        onMouseUp={stop}
                        className="inline-flex items-center rounded border bg-white border-gray-200 px-1 font-sans text-xs text-gray-400"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Mic color="green" className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div
                      className="absolute inset-x-0 bottom-0 "
                      aria-hidden="true"
                    />
                  </div>
                </div>
                {error && (
                  <div className="border border-red-400 rounded-md p-2">
                    <p className="text-red-500 text-xs">{error}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </div>
        </div>
      </AccordionItem>
    </Accordion>
  );
};

export default Chat;

{
  /* {message.sourceDocs && (
                        <div
                          className="p-5"
                          key={`sourceDocsAccordion-${index}`}
                        >
                          <Accordion
                            type="single"
                            collapsible
                            className="flex-col"
                          >
                            {message.sourceDocs.map((doc, index) => (
                              <div key={`messageSourceDocs-${index}`}>
                                <AccordionItem value={`item-${index}`}>
                                  <AccordionTrigger>
                                    <h3>Source {index + 1}</h3>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ReactMarkdown linkTarget="_blank">
                                      {doc.pageContent}
                                    </ReactMarkdown>
                                    <p className="mt-2">
                                      <b>Source:</b> {doc.metadata.source}
                                    </p>
                                  </AccordionContent>
                                </AccordionItem>
                              </div>
                            ))}
                          </Accordion>
                        </div>
                      )} */
}
