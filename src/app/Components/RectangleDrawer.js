import { Box } from '@chakra-ui/react';
import React, { useRef, useEffect } from 'react';

function RectangleDrawer({ coordinates }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (coordinates.length === 4) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.moveTo(coordinates[0][0], coordinates[0][1]);

      for (let i = 1; i < coordinates.length; i++) {
        ctx.lineTo(coordinates[i][0], coordinates[i][1]);
      }

      ctx.closePath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'red';
      ctx.stroke();
    }
  }, [coordinates]);

  return (
    <Box position={"absolute"}>
      <canvas
        ref={canvasRef}
        width={1200} // Set canvas dimensions as needed
        height={1200} // Set canvas dimensions as needed
        style={{ border: '1px solid black' }}
      ></canvas>
    </Box>
  );
}

export default RectangleDrawer;
