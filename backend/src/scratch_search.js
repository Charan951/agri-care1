const fs = require('fs');
const file = fs.readFileSync("c:\\Users\\Lenovo\\OneDrive\\Desktop\\agri-care1\\frontend\\src\\components\\specialist\\ConsultationWorkspace.tsx", 'utf8');
const lines = file.split('\n');
lines.forEach((line, idx) => {
  if (line.includes("Secure Chat Room") || line.includes("Replies") || line.includes("Workspace") || line.includes("chatHistory")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
