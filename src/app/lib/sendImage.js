import axios from "axios";

const sendImage = async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
  
      const response = await axios.post('http://127.0.0.1:8000/api/ocr',formData, {

        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      return response.data;
    } catch (error) {
      console.error('Error sending image:', error);
      throw error;
    }
  };

  export default sendImage