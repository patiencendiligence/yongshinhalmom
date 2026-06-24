import axios from "axios";

async function main() {
  const mockPillars = {
    yearPillar: "갑진",
    monthPillar: "무진",
    dayPillar: "무오",
    timePillar: "임술"
  };

  try {
    console.log("Testing /api/generate-daily...");
    const dailyRes = await axios.post("http://localhost:3000/api/generate-daily", {
      pillars: mockPillars,
      zodiac: 4,
      lang: "ko"
    });
    console.log("DAILY SUCCESS:", JSON.stringify(dailyRes.data, null, 2));
  } catch (err: any) {
    if (err.response) {
      console.error("DAILY ERROR (Response):", err.response.status, err.response.data);
    } else {
      console.error("DAILY ERROR (Message):", err.message);
    }
  }
}

main();
