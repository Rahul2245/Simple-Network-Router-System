

#  Simple Network Router


##  Overview
**Router Simulator** is an interactive network routing simulator designed to visualize and demonstrate how routing algorithms operate in real time. It enables users to construct custom network topologies by adding routers (nodes) and links (edges), and then apply different routing strategies to compute optimal paths.

The simulator supports multiple routing algorithms and evaluation metrics, allowing users to observe how routing decisions change based on network conditions. With both 2D and 3D visualization modes, it transforms abstract networking concepts into an intuitive and engaging learning experience.

---

##  Idea Behind the Project
Routing algorithms such as Link State and Distance Vector are fundamental to computer networks, but they are often difficult to understand through theory alone.

**RouteCraft** was built to address this gap by providing a hands-on, visual platform where users can experiment with network configurations and observe routing decisions in real time.

###  Key Motivations
- Simplify complex networking concepts through visualization  
- Provide an interactive learning tool for students and developers  
- Bridge the gap between theory and practical understanding  
- Enable experimentation with different algorithms and metrics  

---

##  Screenshots

![WhatsApp Image 2026-04-11 at 11 10 00 PM](https://github.com/user-attachments/assets/17e3961b-cf07-46de-b2de-1cd208a5d154)
![WhatsApp Image 2026-04-11 at 11 10 13 PM](https://github.com/user-attachments/assets/885f5cbb-a7a1-4f23-a4bc-b443ba0ce275)



---

##  Features

###  Algorithms
- Distance Vector (Bellman-Ford)
- Link State Routing
- Dijkstra Algorithm

###  Metrics
- Cumulative Cost
- Hop Count
- Network Delay

###  Controls
- Start Simulation
- Step-by-step Execution
- Reset Network

###  Visualization
- 2D Map View
- 3D Globe View (Three.js)

###  System Event Log
- Displays real-time routing updates and algorithm steps

---

##  Tech Stack

###  Frontend
- React (MERN Stack)
- Three.js (3D Visualization)
- HTML, CSS, JavaScript

###  Backend
- Node.js
- Express.js

---

##  Core Concepts
- Graph Data Structures
- Shortest Path Algorithms
- Network Routing Simulation

---

##  Technical Architecture

###  Network Model
- Nodes → Routers  
- Edges → Links with weights  

###  Routing Logic
- Distance Vector → Iterative updates from neighbors  
- Link State → Builds full topology and applies Dijkstra  
- Dijkstra → Computes shortest paths from a source node  

###  Simulation Engine
- Executes algorithm steps dynamically  
- Updates routes based on selected metric  
- Logs each step in the system event panel  

###  Visualization Layer
- 2D rendering using graph layouts  
- 3D rendering using Three.js  

---

##  How It Works
1. Create a network topology by adding nodes and links  
2. Select a routing algorithm and metric  
3. Start the simulation  
4. Observe route computation in real time  

---

##  Run Locally

###  Prerequisites
- Node.js (v18 or above)
- npm

### 1️ Clone the Repository
```bash
git clone https://github.com/Rahul2245/Simple-Network-Router-System
cd Simple-Network-Router-System
```

### 2️ Backend Setup
```bash
cd backend
npm install
node server.js
```
### 3️ Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
### 4️ Run Application

👉 http://localhost:3000

---

##  Learning Outcomes
- Understanding routing algorithms (Dijkstra, Bellman-Ford, Link State)
- Practical application of graph theory
- Visualization of network behavior

---

##  Team Members
- Rahul Gajula – 2024BCS-022
- Pathakota Zenith Reddy – 2024BCS-044
- Akshitha Muttangi – 2024BCS-038
- Raga Hasini Kalluri – 2024BCS-030
