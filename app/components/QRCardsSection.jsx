"use client";

import { useState } from "react";
import QRCode from "react-qr-code";

const PACKS = [
  { qty: 5,  price: "Rs.375",   per: "Rs.75/card",  label: "Starter",        hot: false },
  { qty: 10, price: "Rs.699",   per: "Rs.69/card",  label: "Popular",        hot: false },
  { qty: 15, price: "Rs.999",   per: "Rs.66/card",  label: "Most ordered",   hot: true  },
  { qty: 25, price: "Rs.1,499", per: "Rs.59/card",  label: "Multi-property", hot: false },
];

export default function QRCardsSection() {
  const [selected, setSelected] = useState(2);
  const pack = PACKS[selected];
  const waMsg = "Hi, I want to order Pack of " + pack.qty + " QR cards (" + pack.price + ") from InsightRep.";
  const waUrl = "https://wa.me/917387609098?text=" + encodeURIComponent(waMsg);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-12 justify-center">
      <div className="flex-shrink-0 flex flex-col items-center">
        <style>{\`
          .flip-scene{width:260px;height:400px;perspective:1000px;cursor:pointer;}
          .flip-card{width:100%;height:100%;position:relative;transform-style:preserve-3d;transform:rotateY(-15deg) rotateX(6deg);transition:transform 0.7s cubic-bezier(.4,0,.2,1);animation:cardFloat 4s ease-in-out infinite;}
          .flip-scene:hover .flip-card{transform:rotateY(180deg) rotateX(0deg);animation:none;}
          @keyframes cardFloat{0%,100%{transform:rotateY(-15deg) rotateX(6deg) translateY(0);}50%{transform:rotateY(-15deg) rotateX(6deg) translateY(-14px);}}
          .card-face{position:absolute;width:100%;height:100%;border-radius:20px;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden;}
          .card-front{background:linear-gradient(145deg,#1a2e50,#0d1b35);border:1px solid rgba(255,255,255,0.1);box-shadow:18px 18px 60px rgba(0,0,0,0.7);display:flex;flex-direction:column;align-items:center;padding:24px 20px;}
          .card-back{background:linear-gradient(145deg,#0d1b35,#08111f);border:1px solid rgba(229,50,45,0.25);box-shadow:18px 18px 60px rgba(0,0,0,0.7);transform:rotateY(180deg);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;}
        \`}</style>
        <div className="flip-scene">
          <div className="flip-card">
            <div className="card-face card-front">
              <p className="text-[9px] font-bold tracking-[3px] text-accent uppercase self-start mb-1">InsightRep</p>
              <p className="text-base font-bold text-white self-start mb-0.5">Your Business Name</p>
              <p className="text-[10px] text-white/30 self-start mb-4">Scan to review us on Google</p>
              <div className="bg-white rounded-xl p-3 flex items-center justify-center mb-4" style={{width:148,height:148}}>
                <QRCode value="https://qr.insightmedia.co.in" size={120} level="M" />
              </div>
              <p className="text-[10px] text-white/30 mb-4">Scan to leave a Google review</p>
              <div className="w-full h-px bg-white/10 mb-3" />
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-[9px] font-bold tracking-[2px] text-accent uppercase">InsightRep</p>
                  <p className="text-[9px] text-white/20">By Insight Media</p>
                </div>
                <div className="w-7 h-5 rounded opacity-75" style={{background:"linear-gradient(135deg,#d4a843,#f0c850)"}} />
              </div>
            </div>
            <div className="card-face card-back">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-5" style={{boxShadow:"0 8px 32px rgba(229,50,45,0.4)"}}>
                <span className="text-white font-bold text-xl">IR</span>
              </div>
              <p className="text-white font-bold text-xl mb-1.5">InsightRep</p>
              <p className="text-white/30 text-xs text-center leading-relaxed mb-6">AI-powered Google reviews for Indian hospitality</p>
              <div className="w-10 h-0.5 bg-accent rounded mb-5" />
              <p className="text-white/25 text-[11px] font-semibold tracking-wide mb-1.5">qr.insightmedia.co.in</p>
              <p className="text-white/15 text-[10px]">By Insight Media, Chh. Sambhajinagar</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-white/20 mt-4">Hover to flip</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {PACKS.map(function(p, i) {
          var isSelected = selected === i;
          var borderClass = isSelected ? "border-accent bg-accent/10" : p.hot ? "border-accent/30 bg-accent/5" : "border-white/10 bg-white/5";
          return (
            <button key={p.qty} type="button" onClick={function(){ setSelected(i); }}
              className={"flex items-center justify-between rounded-2xl border px-5 py-4 transition-all duration-200 text-left w-full " + borderClass}>
              <div>
                {isSelected && <span className="inline-block bg-accent text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide mb-1">Selected</span>}
                {p.hot && !isSelected && <span className="inline-block bg-accent text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide mb-1">Best value</span>}
                <p className="text-sm font-semibold text-white">Pack of {p.qty}</p>
                <p className="text-[10px] text-text-muted">{p.label} - {p.per}</p>
              </div>
              <div className="text-right">
                <p className={isSelected ? "text-xl font-bold text-accent" : "text-xl font-bold text-white"}>{p.price}</p>
                <p className="text-[9px] text-text-muted">+ delivery</p>
              </div>
            </button>
          );
        })}
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white hover:brightness-110 transition mt-1"
          style={{textDecoration:"none"}}>
          Order Pack of {pack.qty} on WhatsApp - {pack.price}
        </a>
        <p className="text-center text-[10px] text-text-muted">PVC premium quality - Custom branded - Delivered in 3-5 working days</p>
      </div>
    </div>
  );
}
