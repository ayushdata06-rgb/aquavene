import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Scenario, ScenarioResult, ScoringWeights } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import {
  Sliders,
  Play,
  RotateCcw,
  Save,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  Scale,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const DEFAULT_WEIGHTS: ScoringWeights = {
  erosion_potential: 0.20,
  runoff_potential: 0.25,
  landcover_degradation: 0.15,
  rainfall_pressure: 0.20,
  downstream_exposure: 0.20,
};

export const ScenarioSimulator: React.FC = () => {
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [scenarioName, setScenarioName] = useState('Alternative Priority Scenario');
  const [description, setDescription] = useState('Sensitivity analysis with adjusted criteria weighting');
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([]);
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const totalWeight = Math.round(
    (weights.erosion_potential +
      weights.runoff_potential +
      weights.landcover_degradation +
      weights.rainfall_pressure +
      weights.downstream_exposure) * 100
  ) / 100;

  const isValidWeight = Math.abs(totalWeight - 1.0) < 0.001;

  useEffect(() => {
    async function loadScenarios() {
      try {
        const scs = await api.getScenarios();
        setSavedScenarios(scs);
        // Run initial simulation
        const initialRes = api.simulateScenario(DEFAULT_WEIGHTS);
        setResults(initialRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadScenarios();
  }, []);

  const handleSliderChange = (field: keyof ScoringWeights, val: number) => {
    setWeights((prev) => ({
      ...prev,
      [field]: Math.round(val * 100) / 100,
    }));
  };

  const handleRunSimulation = () => {
    if (!isValidWeight) return;
    const simRes = api.simulateScenario(weights);
    setResults(simRes);
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
    const simRes = api.simulateScenario(DEFAULT_WEIGHTS);
    setResults(simRes);
  };

  const handleSaveScenario = () => {
    if (!isValidWeight) return;
    const newSc: Scenario = {
      id: `sc-${Date.now()}`,
      name: scenarioName,
      description,
      weights,
      created_at: new Date().toISOString(),
      results,
    };
    setSavedScenarios([newSc, ...savedScenarios]);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLoadScenario = (sc: Scenario) => {
    setWeights(sc.weights);
    setScenarioName(sc.name);
    setDescription(sc.description);
    const simRes = api.simulateScenario(sc.weights);
    setResults(simRes);
  };

  if (loading) {
    return <LoadingSkeleton rows={8} />;
  }

  // Chart data: Top 8 watersheds comparing Baseline vs Scenario
  const comparisonChartData = results.slice(0, 8).map((r) => ({
    name: r.watershed_code,
    Baseline: r.baseline_score,
    Scenario: r.scenario_score,
    delta: r.score_delta,
  }));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Policy Scenario Simulator
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Evaluate weight sensitivity across indicators, compare rank shifts, and simulate policy priorities
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleResetWeights}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Baseline</span>
          </button>
          <button
            onClick={handleRunSimulation}
            disabled={!isValidWeight}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 rounded-xl transition-all shadow-sm"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Run Simulation</span>
          </button>
        </div>
      </div>

      {/* Mandatory Governance Warning */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-300 space-y-2">
        <div className="flex items-center space-x-2 font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>Sensitivity Analysis vs Physical Environmental Modeling Disclaimer</span>
        </div>
        <p className="text-amber-200/80 leading-relaxed text-[11px]">
          This tool performs <strong>policy weighting sensitivity analysis</strong>. Changing weights shifts
          restoration investment priority according to administrative objectives (e.g., soil conservation vs flood protection).
          <strong> Never present an indicator weight adjustment as a real-world hydrological reduction in runoff or flood probability.</strong>{' '}
          Physical watershed remediation estimates require hydraulic and ground-calibrated hydrodynamic modeling.
        </p>
      </div>

      {/* Weight Controls & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Panel */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-brand-400" />
              Policy Weight Allocation
            </h3>

            {/* Total Weight Badge */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Total Weight:</span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold border ${
                  isValidWeight
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                }`}
              >
                {totalWeight.toFixed(2)} / 1.00 {isValidWeight ? '✓' : '(Must = 1.00)'}
              </span>
            </div>
          </div>

          {/* 5 Indicator Sliders */}
          <div className="space-y-4">
            {[
              { key: 'erosion_potential', label: 'Erosion Potential (w₁)', desc: 'Priority on steep terrain and bare soil risk' },
              { key: 'runoff_potential', label: 'Runoff Potential (w₂)', desc: 'Priority on high flow accumulation and steep gradient' },
              { key: 'landcover_degradation', label: 'Land-Cover Degradation (w₃)', desc: 'Priority on fragmented vegetation and bare zones' },
              { key: 'rainfall_pressure', label: 'Rainfall Pressure (w₄)', desc: 'Priority on heavy annual/monsoon precipitation depth' },
              { key: 'downstream_exposure', label: 'Downstream Exposure (w₅)', desc: 'Priority on population in downstream buffer zones' },
            ].map(({ key, label, desc }) => {
              const weightVal = weights[key as keyof ScoringWeights];
              return (
                <div key={key} className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white">{label}</span>
                      <p className="text-[11px] text-slate-500">{desc}</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-aqua-400 pl-4">
                      {(weightVal * 100).toFixed(0)}% ({weightVal.toFixed(2)})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weightVal}
                    onChange={(e) =>
                      handleSliderChange(key as keyof ScoringWeights, parseFloat(e.target.value))
                    }
                    className="w-full accent-brand-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          {/* Scenario Name & Save */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Scenario name..."
              className="text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 w-full sm:w-64"
            />
            <button
              onClick={handleSaveScenario}
              disabled={!isValidWeight}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5 text-brand-400" />
              <span>{savedSuccess ? 'Saved ✓' : 'Save Scenario'}</span>
            </button>
          </div>
        </div>

        {/* Preset & Saved Scenarios Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
              <Scale className="h-4 w-4 text-aqua-400" />
              Saved Policy Profiles
            </h3>

            <div className="space-y-2.5">
              {savedScenarios.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => handleLoadScenario(sc)}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white">{sc.name}</h4>
                    <span className="text-[10px] text-slate-500">
                      {new Date(sc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{sc.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1 text-[10px] text-slate-500 font-mono">
                    <span>E: {sc.weights.erosion_potential}</span> •
                    <span>R: {sc.weights.runoff_potential}</span> •
                    <span>L: {sc.weights.landcover_degradation}</span> •
                    <span>W: {sc.weights.rainfall_pressure}</span> •
                    <span>D: {sc.weights.downstream_exposure}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-500 space-y-1">
            <span className="text-slate-400 font-semibold block">Baseline Reference</span>
            <p>E: 0.20, R: 0.25, L: 0.15, W: 0.20, D: 0.20</p>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-400" />
          Score Sensitivity: Baseline vs Scenario (Top 8 Watersheds)
        </h3>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                itemStyle={{ fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Baseline" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Scenario" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Results Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Simulated Rank & Score Deltas
          </h3>
          <span className="text-xs text-slate-400">
            {results.filter((r) => r.rank_delta > 0).length} watersheds moved up in priority
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                <th className="py-3 px-4">Scenario Rank</th>
                <th className="py-3 px-4">Watershed</th>
                <th className="py-3 px-4 text-right">Baseline Score</th>
                <th className="py-3 px-4 text-right">Scenario Score</th>
                <th className="py-3 px-4 text-right">Δ Score</th>
                <th className="py-3 px-4 text-center">Rank Shift</th>
                <th className="py-3 px-4 text-center">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {results.slice(0, 10).map((r) => (
                <tr key={r.watershed_id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-bold text-white">#{r.scenario_rank}</td>
                  <td className="py-2.5 px-4">
                    <span className="font-semibold text-white">{r.watershed_name}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">{r.watershed_code}</span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">{r.baseline_score}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                    {r.scenario_score}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    <span
                      className={`font-semibold ${
                        r.score_delta > 0
                          ? 'text-emerald-400'
                          : r.score_delta < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {r.score_delta > 0 ? `+${r.score_delta}` : r.score_delta}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {r.rank_delta > 0 ? (
                      <span className="inline-flex items-center text-emerald-400 font-semibold gap-0.5">
                        <TrendingUp className="h-3 w-3" /> +{r.rank_delta}
                      </span>
                    ) : r.rank_delta < 0 ? (
                      <span className="inline-flex items-center text-rose-400 font-semibold gap-0.5">
                        <TrendingDown className="h-3 w-3" /> {r.rank_delta}
                      </span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        r.priority_category === 'Critical'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          : r.priority_category === 'High'
                          ? 'bg-orange-500/10 text-orange-300 border-orange-500/20'
                          : r.priority_category === 'Moderate'
                          ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      {r.priority_category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
