// "use client"

// import { useEffect, useState } from "react"

// // Animations component to inject all CSS animations
// export const Animations = () => {
//   useEffect(() => {
//     const styleEl = document.createElement("style")

//     styleEl.textContent = `
//       /* Import Google Fonts */
//       @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
      
//       /* Base font styles */
//       body {
//         font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//       }
      
//       h1, h2, h3, h4, h5, h6 {
//         font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//       }
      
//       @keyframes float {
//         0%, 100% { transform: translateY(0); }
//         50% { transform: translateY(-10px); }
//       }
      
//       @keyframes bounce-subtle {
//         0%, 100% { transform: translateY(0); }
//         50% { transform: translateY(-5px); }
//       }
      
//       @keyframes bounce-x {
//         0%, 100% { transform: translateX(0); }
//         50% { transform: translateX(3px); }
//       }
      
//       @keyframes shimmer {
//         0% { transform: translateX(-100%); }
//         100% { transform: translateX(100%); }
//       }
      
//       @keyframes pulse-subtle {
//         0%, 100% { opacity: 1; }
//         50% { opacity: 0.7; }
//       }
      
//       @keyframes fade-in {
//         from {
//           opacity: 0;
//           transform: translateY(10px);
//         }
//         to {
//           opacity: 1;
//           transform: translateY(0);
//         }
//       }
      
//       @keyframes slide-in-top {
//         from {
//           transform: translateY(-100%);
//           opacity: 0;
//         }
//         to {
//           transform: translateY(0);
//           opacity: 1;
//         }
//       }
      
//       @keyframes slide-in-left {
//         from {
//           transform: translateX(-100%);
//           opacity: 0;
//         }
//         to {
//           transform: translateX(0);
//           opacity: 1;
//         }
//       }
      
//       @keyframes slide-in-right {
//         from {
//           transform: translateX(100%);
//           opacity: 0;
//         }
//         to {
//           transform: translateX(0);
//           opacity: 1;
//         }
//       }
      
//       @keyframes scale-in {
//         from {
//           transform: scale(0.8);
//           opacity: 0;
//         }
//         to {
//           transform: scale(1);
//           opacity: 1;
//         }
//       }
      
//       @keyframes rotate-in {
//         from {
//           transform: rotate(-10deg) scale(0.9);
//           opacity: 0;
//         }
//         to {
//           transform: rotate(0) scale(1);
//           opacity: 1;
//         }
//       }
      
//       @keyframes glow {
//         0%, 100% {
//           box-shadow: 0 0 5px rgba(139, 92, 246, 0.5);
//         }
//         50% {
//           box-shadow: 0 0 20px rgba(139, 92, 246, 0.8);
//         }
//       }
      
//       @keyframes progress-fill {
//         from { width: 0%; }
//         to { width: var(--target-width, 100%); }
//       }
      
//       @keyframes sparkle {
//         0%, 100% { transform: scale(0.8); opacity: 0.2; }
//         50% { transform: scale(1.2); opacity: 1; }
//       }
      
//       @keyframes ripple {
//         0% {
//           box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.3);
//         }
//         100% {
//           box-shadow: 0 0 0 20px rgba(139, 92, 246, 0);
//         }
//       }
      
//       @keyframes float-rotate {
//         0% { transform: translateY(0) rotate(0); }
//         50% { transform: translateY(-5px) rotate(5deg); }
//         100% { transform: translateY(0) rotate(0); }
//       }
      
//       @keyframes page-reveal {
//         0% { opacity: 0; }
//         20% { opacity: 0; }
//         100% { opacity: 1; }
//       }
      
//       @keyframes scroll-reveal {
//         from {
//           opacity: 0;
//           transform: translateY(30px);
//         }
//         to {
//           opacity: 1;
//           transform: translateY(0);
//         }
//       }
      
//       .animate-float { animation: float 6s ease-in-out infinite; }
//       .animate-bounce-subtle { animation: bounce-subtle 6s ease-in-out infinite; }
//       .animate-bounce-x { animation: bounce-x 1.5s ease-in-out infinite; }
//       .animate-shimmer { animation: shimmer 2s infinite linear; }
//       .animate-pulse-subtle { animation: pulse-subtle 3s infinite ease-in-out; }
//       .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
//       .animate-slide-in-top { animation: slide-in-top 0.5s ease-out forwards; }
//       .animate-slide-in-left { animation: slide-in-left 0.5s ease-out forwards; }
//       .animate-slide-in-right { animation: slide-in-right 0.5s ease-out forwards; }
//       .animate-scale-in { animation: scale-in 0.5s ease-out forwards; }
//       .animate-rotate-in { animation: rotate-in 0.5s ease-out forwards; }
//       .animate-glow { animation: glow 2s infinite ease-in-out; }
//       .animate-progress-fill { animation: progress-fill 1.5s ease-out forwards; }
//       .animate-sparkle { animation: sparkle 2s infinite ease-in-out; }
//       .animate-ripple { animation: ripple 1.5s infinite; }
//       .animate-float-rotate { animation: float-rotate 8s ease-in-out infinite; }
//       .animate-page-reveal { animation: page-reveal 1.2s ease-out forwards; }
//       .animate-scroll-reveal { animation: scroll-reveal 0.8s ease-out forwards; }
      
//       .delay-100 { animation-delay: 0.1s; }
//       .delay-200 { animation-delay: 0.2s; }
//       .delay-300 { animation-delay: 0.3s; }
//       .delay-400 { animation-delay: 0.4s; }
//       .delay-500 { animation-delay: 0.5s; }
//       .delay-600 { animation-delay: 0.6s; }
//       .delay-700 { animation-delay: 0.7s; }
//       .delay-800 { animation-delay: 0.8s; }
//       .delay-900 { animation-delay: 0.9s; }
//       .delay-1000 { animation-delay: 1s; }
//       .delay-1500 { animation-delay: 1.5s; }
//       .delay-2000 { animation-delay: 2s; }
      
//       .scroll-reveal {
//         opacity: 0;
//         transform: translateY(30px);
//         transition: opacity 0.8s ease-out, transform 0.8s ease-out;
//       }
      
//       .scroll-reveal.revealed {
//         opacity: 1;
//         transform: translateY(0);
//       }
//     `

//     document.head.appendChild(styleEl)

//     return () => {
//       document.head.removeChild(styleEl)
//     }
//   }, [])

//   return null
// }

// // ScrollReveal component to handle scroll animations
// export function ScrollReveal() {
//   useEffect(() => {
//     const observerOptions = {
//       root: null, // use viewport as root
//       rootMargin: "0px",
//       threshold: 0.15, // trigger when 15% of the element is visible
//     }

//     const handleIntersect = (entries, observer) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           entry.target.classList.add("revealed")
//           // Once revealed, stop observing to avoid re-triggering
//           observer.unobserve(entry.target)
//         }
//       })
//     }

//     const observer = new IntersectionObserver(handleIntersect, observerOptions)

//     // Select all elements with the scroll-reveal class
//     const elements = document.querySelectorAll(".scroll-reveal")
//     elements.forEach((el) => observer.observe(el))

//     return () => {
//       elements.forEach((el) => observer.unobserve(el))
//       observer.disconnect()
//     }
//   }, [])

//   return null
// }

// // PageLoadAnimation Component
// export function PageLoadAnimation() {
//   const [visible, setVisible] = useState(true)

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setVisible(false)
//     }, 2000)

//     return () => clearTimeout(timer)
//   }, [])

//   if (!visible) return null

//   return (
//     <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
//       <div className="flex flex-col items-center">
//         <div className="relative w-24 h-24 mb-4">
//           <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full animate-pulse-subtle"></div>
//           <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
//             <div className="h-10 w-10 text-violet-600 animate-bounce-subtle">
//               {/* Gift icon placeholder - will be provided by parent component */}
//             </div>
//           </div>
//           <div className="absolute -top-1 -right-1 w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center animate-sparkle">
//             <div className="h-3 w-3 text-violet-600">
//               {/* Sparkles icon placeholder - will be provided by parent component */}
//             </div>
//           </div>
//           <div
//             className="absolute -bottom-1 -left-1 w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center animate-sparkle"
//             style={{ animationDelay: "0.5s" }}
//           >
//             <div className="h-3 w-3 text-violet-600">
//               {/* Sparkles icon placeholder - will be provided by parent component */}
//             </div>
//           </div>
//         </div>
//         <p className="text-lg font-semibold bg-gradient-to-r from-violet-700 to-violet-500 bg-clip-text text-transparent animate-pulse-subtle">
//           Loading Gift Tracker...
//         </p>
//       </div>
//     </div>
//   )
// }

// // MobileSwipeHint Component
// export function MobileSwipeHint() {
//   const [visible, setVisible] = useState(true)

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setVisible(false)
//     }, 5000)

//     return () => clearTimeout(timer)
//   }, [])

//   if (!visible) return null

//   return (
//     <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-violet-600 to-violet-500 text-white px-4 py-2 rounded-full text-xs flex items-center gap-2 shadow-lg animate-pulse sm:hidden z-50 backdrop-blur-sm">
//       <div className="h-4 w-4 animate-bounce-x">
//         {/* ChevronLeft icon placeholder - will be provided by parent component */}
//       </div>
//       <span>Swipe to see all steps</span>
//       <div className="h-4 w-4 animate-bounce-x">
//         {/* ChevronRight icon placeholder - will be provided by parent component */}
//       </div>
//     </div>
//   )
// }

// // StickyStatusHeader Component
// export function StickyStatusHeader() {
//   const [isVisible, setIsVisible] = useState(false)

//   useEffect(() => {
//     const handleScroll = () => {
//       // Show sticky header after scrolling past 300px
//       if (window.scrollY > 300) {
//         setIsVisible(true)
//       } else {
//         setIsVisible(false)
//       }
//     }

//     window.addEventListener("scroll", handleScroll)
//     return () => window.removeEventListener("scroll", handleScroll)
//   }, [])

//   if (!isVisible) return null

//   return (
//     <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-violet-100 shadow-sm py-2 px-4 z-50 sm:hidden animate-slide-in-top">
//       <div className="flex items-center justify-between max-w-4xl mx-auto">
//         <div className="flex items-center gap-2">
//           <div className="bg-gradient-to-br from-violet-100 to-violet-200 p-1.5 rounded-full">
//             <div className="h-3.5 w-3.5 text-violet-600">
//               {/* Truck icon placeholder - will be provided by parent component */}
//             </div>
//           </div>
//           <span className="text-sm font-medium">Premium Coffee Set</span>
//         </div>
//         <div className="bg-gradient-to-r from-violet-600 to-violet-500 hover:bg-violet-700 text-[10px] inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent text-white hover:bg-opacity-80">
//           In Transit
//         </div>
//       </div>
//     </div>
//   )
// }

