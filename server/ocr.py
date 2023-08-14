from fastapi import FastAPI, File, UploadFile,Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR,draw_ocr
import cv2
import os
from uuid import uuid4
import numpy as np
from PIL import Image
from manga_ocr import MangaOcr
from sse_starlette.sse import EventSourceResponse
import json



app = FastAPI()
mocr = MangaOcr()
UPLOAD_DIR = "uploads"

# Define CORS settings
origins = [
    "http://localhost",      # Allow requests from localhost
    "http://localhost:3000", # Allow requests from a specific port
    "https://example.com",   # Allow requests from a specific domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


def find_close_boxes(boxes, threshold):
    close_box_pairs = []
    curr_box = ""
    for i in range(len(boxes)):
        box1 = boxes[i]
        y1 = (box1["box"][0][1] + box1["box"][2][1])  # Calculate Y midpoint of box 1
        for j in range(i + 1, len(boxes)):
            box2 = boxes[j]
            y2 = (box2["box"][0][1] + box2["box"][2][1])  # Calculate Y midpoint of box 2
            
            if abs(y1 - y2) <= threshold:
                close_box_pairs.append((box1, box2))

                
    return close_box_pairs

# find all speech bubbles in the given comic page and return a list of cropped speech bubbles (with possible false positives)
def findSpeechBubbles(imagePath, method):

    # read image
    image = cv2.imread(imagePath)
    # gray scale
    imageGray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # filter noise
    imageGrayBlur = cv2.GaussianBlur(imageGray, (3, 3), 0)
    if method != 'simple':
        # recognizes more complex bubble shapes
        imageGrayBlurCanny = cv2.Canny(imageGrayBlur, 50, 500)
        binary = cv2.threshold(imageGrayBlurCanny, 235,
                               255, cv2.THRESH_BINARY)[1]
    else:
        # recognizes only rectangular bubbles
        binary = cv2.threshold(imageGrayBlur, 235, 255, cv2.THRESH_BINARY)[1]

    # find contours
    contours = cv2.findContours(
        binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)[0]

    # get the list of cropped speech bubbles

    croppedImageList = []
    i = 0
    for contour in contours:

        contour = contour.astype(np.int32)
        rect = cv2.boundingRect(contour)



        [x, y, w, h] = rect

        # filter out speech bubble candidates with unreasonable size
        if w < 500 and w > 50 and h < 900 and h > 40:
            
            cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
            # cv2.drawContours(image, [contour], 0, (0, 0, 255), 2)
            cv2.imwrite(UPLOAD_DIR+"/"+str(i)+".jpg", image)
            croppedImage = image[y:y+h, x:x+w]
            croppedImageList.append(croppedImage)
            cv2.imwrite(UPLOAD_DIR+"/"+'cropped/'+ str(i)+".jpg", croppedImage)
            i += 1

    return croppedImageList

def load_images_from_directory(directory, target_size):
    image_list = []
    for filename in os.listdir(directory):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
            image_path = os.path.join(directory, filename)
            try:
                image = Image.open(image_path)
                image = image.resize(target_size)  # Resize the image to a common size
                image_list.append(image)
            except Exception as e:
                print(f"Error loading image '{filename}': {e}")
    return image_list

def images_to_ndarray(image_list):
    image_array = np.stack([np.array(image) for image in image_list])
    print(image_array)
    return image_array

async def text_generator(request):
    i = 0
    for img in os.listdir(os.path.join(UPLOAD_DIR,'cropped')):
        if await request.is_disconnected():
            print("client disconnected!!!")
            break
        text = mocr(os.path.join(UPLOAD_DIR,'cropped',img))
        print(text)
        i+=1
        yield json.dumps({"id": i,"source":text})

@app.post("/api/ocr")
async def upload_file(request: Request,file: UploadFile = File(...)):
    print(request.body())
    print(request.form())
    
    try:
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)

        file_extension = file.filename.split(".")[-1]
        new_filename = f"{uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, new_filename)
        try:

            os.mkdir(os.path.join(UPLOAD_DIR,"cropped"))
        except: pass

        with open(file_path, "wb") as f:
            f.write(file.file.read())

        try: 
            findSpeechBubbles(file_path,"simple")
        except Exception as e:
            print(e)
            return JSONResponse(content={"error": e }, status_code=500)
        
        try:
           
            event_generator =  text_generator(request)
            return EventSourceResponse(event_generator)           

            # # Convert the images to a NumPy ndarray
            # ocr = PaddleOCR(use_angle_cls=True, lang='japan')
            # result = ocr.ocr(np_img, cls=True ,det=False) 
            # curr_text_data = ""
            # prev = 0
            # i = 0
            # print(result)
            # for idx in range(len(result)):
               
            #     res = result[idx]
            #     for line in res:
                    
            #         text_data = { "text": line[1][0],
            #                      "box": line[0],
                                 
                                 
            #                       }
            #         current = line[0][3][1]
            #         try:
            #             next = res[i][0][0][1]
            #         except Exception as e: print(e)
                    

            #         distance = next - current  
            #         print(distance)
            #         print(str(next), "-" ,str(current))   
    
            #         i+=1  

            #         # if curr_text_data['box'] 
            #         text_list_data.append(text_data)
                   
            # txts = [line[1][0] for line in result[0]]
            # # boxes = [line[0] for line in result]
            # sentence = ''.join(txts)
            # print(sentence)
            # threshold_distance = 30
            # close_boxes = find_close_boxes(text_list_data, threshold_distance)
            # print(close_boxes)
            # return JSONResponse(content={"data":text_list_data}, status_code=200)
        except Exception as e:
            print(e)

            return JSONResponse(content={"error": "An error occurred while uploading the file"}, status_code=500)

    except Exception as e:
        print(e)

    return JSONResponse(content={"error": "An error occurred while uploading the file"}, status_code=500)
