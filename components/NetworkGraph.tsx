
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Transaction, SuspiciousAccount, RiskLevel } from '../types';

interface NetworkGraphProps {
  transactions: Transaction[];
  suspicious: SuspiciousAccount[];
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ transactions, suspicious }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || transactions.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    // Data Preparation
    const nodesMap = new Map();
    transactions.slice(0, 100).forEach(tx => {
      nodesMap.set(tx.sender, { id: tx.sender });
      nodesMap.set(tx.receiver, { id: tx.receiver });
    });

    const nodes = Array.from(nodesMap.values());
    const links = transactions.slice(0, 100).map(tx => ({
      source: tx.sender,
      target: tx.receiver,
      amount: tx.amount
    }));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Arrowhead definition
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#475569");

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#334155")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.amount) / 10)
      .attr("marker-end", "url(#arrowhead)");

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);

    node.append("circle")
      .attr("r", 12)
      .attr("fill", d => {
        const susp = suspicious.find(s => s.account_id === d.id);
        if (susp?.risk_level === RiskLevel.HIGH) return "#ef4444";
        if (susp?.risk_level === RiskLevel.MEDIUM) return "#f59e0b";
        return "#3b82f6";
      })
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", 24)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .text(d => (d.id as string).substring(0, 8));

    node.append("title")
      .text(d => {
        const susp = suspicious.find(s => s.account_id === d.id);
        return `Account: ${d.id}\nRisk: ${susp?.risk_level || 'Low'}\nReason: ${susp?.detection_reason || 'N/A'}`;
      });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [transactions, suspicious]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-900 rounded-xl border border-slate-700">
      <div className="absolute top-4 left-4 z-10 bg-slate-800/80 backdrop-blur px-3 py-2 rounded-lg text-xs border border-slate-700 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-slate-300">High Risk (Money Muling)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-slate-300">Medium Risk (Suspicious)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-slate-300">Active Node</span>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-move" />
    </div>
  );
};
