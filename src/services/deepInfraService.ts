import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime";

const ENDPOINT_NAME = "jumpstart-dft-meta-vs-sam-2-1-hiera-20250606-032653";
const REGION = "us-east-2";

export interface DetectionResult {
  segmentation: number[][];
  predicted_iou: number;
  point_coords: number[][];
  stability_score: number;
}

const client = new SageMakerRuntimeClient({ region: REGION });

export const detectObjects = async (imageData: ImageData): Promise<DetectionResult[]> => {
  try {
    // Convert ImageData to base64
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw the image data to the canvas
    const bitmap = await createImageBitmap(imageData);
    ctx.drawImage(bitmap, 0, 0);

    // Convert to blob
    const imageBitmap = canvas.transferToImageBitmap();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      // Convert ImageBitmap to ImageData first
      const tempCanvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
      const tempCtx = tempCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
      if (!tempCtx) {
        throw new Error('Failed to get temporary canvas context');
      }
      tempCtx.drawImage(imageBitmap, 0, 0);
      const imageData = tempCtx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
      reader.readAsDataURL(new Blob([imageData.data], { type: 'image/png' }));
    });

    // Call SageMaker endpoint
    const command = new InvokeEndpointCommand({
      EndpointName: ENDPOINT_NAME,
      Body: JSON.stringify({ image: base64 }),
      ContentType: "application/json",
    });

    const response = await client.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.Body));
    return result.predictions || [];
  } catch (error) {
    console.error('Error detecting objects:', error);
    throw error;
  }
}; 