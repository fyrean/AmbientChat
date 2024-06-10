import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import {Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import { Typewriter } from 'react-simple-typewriter';

import {isMobile} from 'react-device-detect';
import AudioPlayer from './AudioPlayer';

const APP_ID = "MidnightMirth";

const initMessages = [
  { "role": "system", "content": "You are Alice, an elf bartender in a fantasy world. You wear a blue dress, with blue eyes and burning red hair. Your face has cute freckles and pointy ears. The time is very late at night and you are closing down soon. The client is the user. The bar is technically closed, so you sit with them on the table on the outside balcony, enjoying the windy late night fresh air. There is a full glass of beer on the table. Some rules: don't need to reintroduce yourself, gently reject any romantic advances (light flirting is fine). absolutely don't speak formally or verbose. Be casual, happy-go-lucky. Lastly, don't do asterisk actions." }
];


const ChatPanel = ({setExpressionImage}) => {
  const [messages, setMessages] = useState([...initMessages]);
  const [input, setInput] = useState('');
  const [waiting, setWaiting] = useState(false);
  const messagesContainerRef = useRef(null);

  function saveMessages(messages){
    localStorage.setItem(APP_ID+ '_messages', JSON.stringify(messages));
  }

  function loadMessages(){
    const savedMessages = localStorage.getItem(APP_ID+ '_messages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  }

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  function truncateMessages(messages, limit=2000) {
    let totalChars = 0;
    let index = messages.length - 1;

    // Loop through messages backwards and sum up the characters
    while (index >= 0) {
        const message = messages[index];
        totalChars += message.content.length;

        // Break the loop once the total character count exceeds 2000
        if (totalChars > limit) {
            break;
        }
        index--;
    }

    // Remove all messages prior to the index where the sum exceeded 2000
    // except for system messages
    const truncatedMessages = [];
    for (let i = 0; i < messages.length; i++) {
        if (i > index || messages[i].role === "system") {
            truncatedMessages.push(messages[i]);
        }
    }
    console.log(truncatedMessages);
    return truncatedMessages;
}

  const expressions = ['neutral', 'pout', 'smile', 'smirk', 'wink', 'glare'];

  const setExpression = (expression) => {
    // Convert the expression parameter to lowercase
    const normalizedExpression = expression.toLowerCase();

    // Check if any expression in the expressions array is part of the normalizedExpression
    const foundExpression = expressions.find(exp => normalizedExpression.includes(exp));

    // If a matching expression is found, call setExpressionImage with it
    if (foundExpression) {
      setExpressionImage(foundExpression);
    }else{
      setExpressionImage('neutral');
    }
  };

  useEffect(()=>{
    const msgs = loadMessages();
    //console.log(msgs);
    if (msgs.length > 0)
      setMessages(msgs);
  }, [])

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const sendMessage = async () => {
    if (input.trim()) {
      const newMessage = { role: "user", content: input };
  
      // Prepare updated messages list
      const updatedMessages = [...messages, newMessage]; // Assume messages is the current state
  
      // Update messages state with new message
      setMessages(updatedMessages);
  
      // Clear the input field
      setInput('');

      setWaiting(true);
  
      // Send updated chat log to the server
      fetch('https://relay.fierylionite.workers.dev/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chat: truncateMessages(updatedMessages) })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Server response:', data);
        // Optionally update your state or UI based on the response
        handleServerResponseChat(data);
      })
      .catch(error => {
        console.error('Error sending messages:', error);
      });
    }
  };
  
// Function to handle data received from the server
const handleServerResponseChat = (data) => {
    if (data && data.length > 0) {
      data.forEach(task => {
        if (task.response) {
          console.log('AI Response:', task.response.response);
          // Update UI or state with AI response, e.g.:
          setMessages(prevMessages =>{ 
            const newMessages = [...prevMessages, { role: "assistant", content: task.response.response }]
            saveMessages(newMessages);
            return newMessages;
          });
          // Send another request to determine the expression
          sendExpressionRequest(task.response.response);

          setWaiting(false);
        }
      });
    }
  };
  
  // Send request to determine facial expression
  const sendExpressionRequest = (userMessage) => {
    const systemMessage = {
      role: "system",
      content: "Determine what facial expression should be used for the user message. Pick one from the following only: neutral, pout, smirk, smile, glare, wink. Use pout for confused or slight annoyance. Respond with one word!"
    };
    const userMessageObject = {
      role: "user",
      content: userMessage
    };
  
    fetch('https://relay.fierylionite.workers.dev/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ chat: [systemMessage, userMessageObject] })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Expression response:', data);
      handleServerResponseExpression(data);
    })
    .catch(error => {
      console.error('Error sending expression request:', error);
    });
  };
  
  // Function to handle the response for expression
  const handleServerResponseExpression = (data) => {
    if (data && data.length > 0) {
      data.forEach(task => {
        if (task.response) {
          console.log('Expression analysis:', task.response.response);
          setExpression(task.response.response.toLowerCase())
          setTimeout(()=>{setExpression('neutral')},5000)
          // You can update state or do something with this expression data
        }
      });
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  const renderMessages = () => {
    const filteredMessages = messages.filter(message => message.role !== 'system');
    const totalMessages = filteredMessages.length;
  
    return filteredMessages.reverse().map((message, index) => {
      let opacity = (totalMessages - index) / totalMessages;
      opacity = Math.max(opacity, 0.2);

      const isLastMessage = index === 0;
  
      const messageWords = message.content.split(' ');
  
      return (
        <Box
          key={index}
          sx={{
            margin: 1,
            padding: 1,
            borderRadius: 1,
            bgcolor: message.role === 'user' ? '#e0f7fa' : '#fff9c4',
            alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
            width: 'fit-content',
            maxWidth: '80%',
            opacity: opacity.toFixed(2),
            boxShadow: '0px 4px 6px rgba(0,0,0,0.5)'
          }}
        >
          {isLastMessage ? (
            <>{false && message.content}
            <Typewriter
            key={`${message.content}-${index}`}
              words={[message.content]}
              typeSpeed={20}
              deleteSpeed={Infinity}
              delaySpeed={1000}
              loop={1}
              cursor={false}
            />
            </>
          ) : (
            message.content
          )}
        </Box>
      );
    });
  };
  

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClearConversation = () => {
    //console.log("Clear conversation");
    setMessages([...initMessages]);
    saveMessages(initMessages);
    handleClose();
  };


  return (
    <>
    {/* New Floating Panel */}
    <Box sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
        position: 'absolute',
        bottom: 2, // Anchored to the bottom of the viewport
        right: '50%', // Positioned at 50% from the left
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(178, 229, 252, 0.7)', // Semi-transparent background
        backdropFilter: isMobile ? 'none' : 'blur(5px)', // Apply blur effect
        justifyContent: 'flex-start', // Aligns the button to the left
        padding: '2px' // Padding around the content
      }}>
        {false && <AudioPlayer url="https://198.245.60.88:8080/stream" />}
        <IconButton
          aria-label="menu"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleClick}
          color="inherit"
          size={isMobile?"small":"large"}
        >
          <MenuIcon fontSize='inherit' />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={open}
          onClose={handleClose}
        >
          <MenuItem onClick={handleClearConversation}>Clear conversation</MenuItem>
        </Menu>
      </Box>

      <Box sx={{
        width: "40%",
        height: '100vh',
        bottom:2,
        backgroundColor: 'transparent',
        position: 'absolute',
        left: '50%',
        transform: 'translateX(0%)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box
          ref={messagesContainerRef}
          className='hidescroll'
          sx={{
            flexGrow: 1,
            overflow:'auto',
            padding: 2,
            display: 'flex',
            flexDirection: 'column-reverse',
          }}
        >
          {renderMessages()}
        </Box>
        <Box sx={{
          width: '100%',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(178, 229, 252, 0.7)', // Semi-transparent background
          backdropFilter: isMobile ? 'none' : 'blur(5px)' // Apply blur effect
        }}>


          <TextField
            fullWidth
            disabled={waiting}
            size={isMobile?"small":"medium"}
            color="primary"
            autoComplete='off'
            variant="outlined"
            placeholder="Type a message..."
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            sx={{ marginRight: 0}}
          />
          <IconButton  aria-label="send" onClick={sendMessage} size={isMobile?"small":"large"}
            disabled={waiting}>
            <SendIcon fontSize="inherit" />
          </IconButton>
        </Box>
      </Box>
    </>
  );
};

export default ChatPanel;
