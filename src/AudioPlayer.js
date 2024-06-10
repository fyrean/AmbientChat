import React, { useState, useRef } from 'react';
import IconButton from '@mui/material/IconButton';

import { Radio, Pause } from '@mui/icons-material';

const AudioPlayer = ({ url }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(new Audio(url));

    const togglePlayPause = () => {
        const prevValue = isPlaying;
        setIsPlaying(!prevValue);
        if (!prevValue) {
            audioRef.current.play();
        } else {
            audioRef.current.pause();
        }
    };

    return (
        <IconButton onClick={togglePlayPause}>
            {isPlaying ? <Pause /> : <Radio />}
        </IconButton>
    );
};

export default AudioPlayer;
