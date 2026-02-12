"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { BookOpen, ArrowRight, Loader2, Scale, AlertCircle } from "lucide-react";
import RuleExplainABI from "./abi.json";

// FIX: Tell TypeScript about MetaMask's window.ethereum object
declare global {
  interface Window {
    ethereum?: any;
  }
}

// --- CONFIGURATION ---
// REPLACE THIS ADDRESS WITH YOUR DEPLOYED CONTRACT
const CONTRACT_ADDRESS = "0x471b16E3cCaBD84EE2905da9273bA193B2b46616"; 

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } catch (err) {
        console.error("Failed to connect", err);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const handleExplain = async () => {
    if (!account || !input) return;

    try {
      setLoading(true);
      setOutput("");
      setStatus("Initializing transaction...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, RuleExplainABI, signer);

      setStatus("Please sign the transaction in your wallet...");
      const tx = await contract.explain_clause(input);
      
      setStatus("Transaction sent! Waiting for block confirmation...");
      await tx.wait();

      setStatus("AI is processing... (This takes about 10-30 seconds)");
      pollResult(contract, input);

    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + (err.reason || err.message));
      setLoading(false);
    }
  };

  const pollResult = async (contract: any, originalText: string) => {
    // Matches the Python contract logic: key is first 60 chars
    const key = originalText.substring(0, 60).trim();
    let attempts = 0;
    const maxAttempts = 30; 

    const interval = setInterval(async () => {
      attempts++;
      try {
        const result = await contract.get_explanation(key);
        
        if (result && result !== "Explanation not found" && result !== "") {
          setOutput(result);
          setStatus("Explanation received!");
          setLoading(false);
          clearInterval(interval);
        } else if (attempts >= maxAttempts) {
            setStatus("Timeout: The AI took too long. Try refreshing the page.");
            setLoading(false);
            clearInterval(interval);
        }
      } catch (e) {
        console.log("Polling...", e);
      }
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400">
            <Scale className="h-6 w-6" />
            <span className="font-bold text-lg tracking-tight text-slate-100">RuleExplain</span>
          </div>
          <button
            onClick={connectWallet}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              account
                ? "bg-slate-800 text-slate-400 cursor-default"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
            }`}
          >
            {account
              ? `${account.slice(0, 6)}...${account.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
            Demystify Legal Jargon
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Paste any complex legal clause below. Our AI-powered consensus engine will translate it into plain English.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          
          {/* Input Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-2xl pointer-events-none" />
            <label className="block text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
              Legal Text
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='e.g., "The party of the first part shall indemnify..."'
              className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-600"
            />
            <div className="mt-6 flex justify-end">
                {!account ? (
                    <p className="text-sm text-yellow-500 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4"/> Connect wallet to submit
                    </p>
                ) : (
                    <button
                        onClick={handleExplain}
                        disabled={loading || !input}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-900/20"
                    >
                        {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                        </>
                        ) : (
                        <>
                            Simplify <ArrowRight className="w-5 h-5" />
                        </>
                        )}
                    </button>
                )}
            </div>
          </div>

          {/* Output Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative min-h-[400px] flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent rounded-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Simplified Explanation
              </label>
              {loading && <span className="text-xs text-indigo-400 animate-pulse">{status}</span>}
            </div>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
              {output ? (
                <div className="prose prose-invert">
                  <p className="text-lg text-emerald-300 leading-relaxed font-medium">
                    {output}
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                  <BookOpen className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Translation will appear here</p>
                </div>
              )}
            </div>
            
            {status && !output && (
                <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/20 rounded-lg text-indigo-300 text-sm text-center">
                    {status}
                </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
