Simple Network Router

Overview
Router Simulator is an interactive network routing simulator designed to visualize and demonstrate how routing algorithms operate in real-time. It enables users to construct custom network topologies by adding routers (nodes) and links (edges), and then apply different routing strategies to compute optimal paths.
The simulator supports multiple routing algorithms and evaluation metrics, allowing users to observe how routing decisions change based on network conditions. With both 2D and 3D visualization modes, it transforms abstract networking concepts into an intuitive and engaging learning experience.

Idea Behind the Project
Routing algorithms such as Link State and Distance Vector are fundamental to computer networks, but they are often difficult to understand when studied only through theory or static examples.
It was built to address this gap by providing a hands-on, visual platform where users can experiment with network configurations and directly observe how routing decisions are made.
The key motivations behind the project were:
•	To simplify complex networking concepts through visualization
•	To provide an interactive learning tool for students and developers
•	To bridge the gap between theoretical knowledge and practical understanding
•	To allow experimentation with different algorithms and metrics in real-time
By enabling users to build their own networks and run simulations step-by-step, RouteCraft helps in developing a deeper intuition of how routing protocols behave in real-world scenarios.
Screenshots
(Add your images here)

Features Algorithms
 
•	Distance Vector (Bellman-Ford)
•	Link State Routing
•	Dijkstra Algorithm
Metrics
•	Cumulative Cost
•	Hop Count
•	Physical Delay
Controls
•	Start Simulation
•	Step-by-step Execution
•	Reset Network
Visualization
•	2D Map View
•	3D Globe View (Three.js)
System Event Log
•	Displays real-time routing updates and algorithm steps

Tech Stack Frontend
•	React (MERN Stack)
•	Three.js (3D visualization)
•	HTML, CSS, JavaScript
Backend
•	Node.js
•	Express.js
Core Concepts
•	Graph Data Structures
•	Shortest Path Algorithms
 
•	Network Routing Simulation

Technical Architecture
•	The network is modeled as a graph:
o	Nodes represent routers
o	Edges represent links with weights
•	Routing Logic
o	Distance Vector uses iterative updates from neighbors
o	Link State builds full topology and applies Dijkstra
o	Dijkstra computes shortest paths from a source node
•	Simulation Engine
o	Runs algorithm steps dynamically
o	Updates routes based on selected metric
o	Logs each step in the system event panel
•	Visualization Layer
o	2D rendering using standard graph layout
o	3D rendering using Three.js for immersive view

How It Works
1.	Create a network topology by adding nodes and links
2.	Select a routing algorithm and metric
3.	Start the simulation
4.	Observe route computation and updates in real-time

Run Locally Prerequisites
•	Node.js (v18 or above)
•	npm
 
1.	Clone the Repository
git clone https://github.com/Rahul2245/Simple-Network-Router-System cd Simple-Network-Router-System
2.	Backend
•	cd backend from step 1
•	npm install
•	node server.js
3.	Frontend
•	cd frontend from step 1
•	npm install
•	npm run dev
4.	Server running
•	go to http://localhost:3000

Learning Outcomes
•	Understanding of routing algorithms (Dijkstra, Bellman-Ford, Link State)
•	Practical application of graph theory
•	Visualization of network behavior
Team
Rahul Gajula – 2024BCS-022
Pathakota Zenith Reddy – 2024BCS-044
 Akshitha Muttangi – 2024BCS-038
  Raga Hasini Kalluri – 2024BCS-030
