import { useRef, useEffect, useState } from "react";
import FrameCard from "./FrameCard";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import data from "./dataSet"



const App = () => {
  const cardRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const checkImages = async () => {
      const promises = data.map(
        (item) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.src = item.qrCodeSrc;
            img.onload = resolve;
            img.onerror = reject;
          })
      );

      try {
        await Promise.all(promises);
        setImagesLoaded(true);
      } catch (error) {
        console.error("Some images failed to load", error);
      }
    };

    checkImages();
  }, []);

  const handleDownload = async () => {
    try {
      if (cardRef.current) {
        // Introduce a delay to ensure the component is fully rendered
        setTimeout(async () => {
          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [210, 296], // A4 size
          });

          const imgWidth = 105; // width for each QR code on A4 (half of the page width)
          const imgHeight = 148; // height for each QR code on A4 (full page height)

          // Split data into chunks of 4 (2x2 grid per page)
          const chunkSize = 4;
          const numChunks = Math.ceil(data.length / chunkSize);

          for (let i = 0; i < numChunks; i++) {
            if (i > 0) {
              pdf.addPage();
            }

            const chunkData = data.slice(i * chunkSize, (i + 1) * chunkSize);

            const dataUrls = await Promise.all(
              chunkData.map((item) => toPng(cardRef.current, { backgroundColor: '#FFFFFF' }))
            );

            chunkData.forEach((item, index) => {
              const rowIndex = Math.floor(index / 2);
              const colIndex = index % 2;

              const x = colIndex * imgWidth;
              const y = rowIndex * imgHeight;

              // Add each frame to the PDF page
              pdf.addImage(dataUrls[index], "PNG", x, y, imgWidth, imgHeight);
            });
          }

          // Save the PDF
          const { workspaceId, userId, qrCodeId } = data[0];
          pdf.save(`${workspaceId}-${userId}-${qrCodeId}-feedback-card.pdf`);
        }, 500); // Delay of 500ms
      }
    } catch (err) {
      console.error("Error generating PDF", err);
    }
  };

  return (
    <div className="p-4">
      <div
        id="printableArea"
        ref={cardRef}
        style={{
          width: "210mm",
          height: "296mm",
          backgroundColor: "white",
          display: "grid",
          gridTemplateColumns: "repeat(2, 105mm)",
          gridTemplateRows: "repeat(2, 148mm)",
          gap: "0mm",
          position: "relative",
        }}
      >
        {data.map((item, index) => (
          <div key={index} className="relative w-[105mm] h-[148mm]">
            <FrameCard
              qrCodeSrc={item.qrCodeSrc}
              workspaceId={item.workspaceId}
              userId={item.userId}
              qrCodeId={item.qrCodeId}
            />
            {/* Markings for cutting */}
            <div
              className="absolute top-0 left-0 w-full h-full"
              style={{ pointerEvents: "none" }}
            ></div>
          </div>
        ))}
      </div>
      <button
        onClick={handleDownload}
        className="fixed bottom-4 right-4 p-2 bg-blue-500 text-white rounded shadow-lg"
        style={{ zIndex: 1000 }}
      >
        Download as PDF
      </button>
    </div>
  );
};

export default App;