import React, { useState, useEffect } from 'react';
import ChatPanel from './ChatPanel';

function App() {
  const [expression, setExpression] = useState('neutral');

  useEffect(() => {
    document.title = 'Midnight Mirth at the Tavern';
    // Function to switch expression to 'closed' and back to 'neutral'
    const changeExpression = () => {
      setExpression('closed');
      setTimeout(() => {
          setExpression(pre=>{
            if (pre == 'closed')
              return 'neutral';
            return pre;
        });
      }, 1000); // Set back to 'neutral' after 2 seconds
    };

    // Set a timer to trigger changeExpression at a random time between 5-10 seconds
    const timer = setTimeout(changeExpression, Math.random() * 5000 + 5000);

    // Clean up the timer when the component unmounts or expression changes
    return () => clearTimeout(timer);
  }, [expression]); // Depend on expression to restart the timer when it changes to 'neutral'

  return (
    <div className="app">
      <video autoPlay loop muted>
        <source src="windytavern.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <img src={`expressions/neutral.png`} alt="Overlay" className="overlay-image" />
      <img src={`expressions/${expression}.png`} alt="Overlay" className="overlay-image" />

      <ChatPanel setExpressionImage={setExpression}/>
    </div>
  );
}

export default App;
