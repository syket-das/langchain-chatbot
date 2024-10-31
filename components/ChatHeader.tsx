// @ts-nocheck
import { FC } from 'react';
import { Mic } from 'lucide-react';

const ChatHeader: FC = ({ listening }) => {
  return (
    <div className="w-full flex gap-3 justify-start items-center text-zinc-800">
      <div className="flex flex-col items-start text-sm">
        <p className="text-xs">Chat with</p>
        <div className="flex gap-1.5 items-center">
          <p className="w-2 h-2 rounded-full bg-green-500" />
          <p className="font-medium flex gap-2">
            LPU support{' '}
            {listening && (
              <span className="text-xs text-green-500 animate-pulse">
                <Mic size={20} />
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
