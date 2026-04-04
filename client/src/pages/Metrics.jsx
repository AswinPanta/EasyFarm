import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { BarChart2, Target, TrendingUp, Award, Database, Cpu, RefreshCw } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const CLASS_COLORS = {
  "Early Blight": "var(--color-warning-agri)",
  "Late Blight":  "var(--color-critical)",
  "Healthy":      "var(--color-healthy)",
};

function MetricCard({ label, value, icon: Icon, color, subtitle }) {
  return (
    <div className="agri-card flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </span>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        {typeof value === "number" ? `${(value * 100).toFixed(1)}%` : value}
      </div>
      {subtitle && (
        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{subtitle}</div>
      )}
    </div>
  );
}

function ConfusionMatrix({ matrix, classes }) {
  if (!matrix || !classes) return null;
  const maxVal = Math.max(...matrix.flat());

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="p-1.5 text-left" style={{ color: "var(--muted-foreground)" }}>
              Actual ↓ / Pred →
            </th>
            {classes.map(c => (
              <th key={c} className="p-1.5 text-center font-bold" style={{ color: CLASS_COLORS[c] || "var(--foreground)" }}>
                {c.split(" ")[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="p-1.5 font-bold text-xs" style={{ color: CLASS_COLORS[classes[i]] || "var(--foreground)" }}>
                {classes[i]?.split(" ")[0]}
              </td>
              {row.map((val, j) => {
                const isCorrect = i === j;
                const intensity = maxVal > 0 ? val / maxVal : 0;
                return (
                  <td
                    key={j}
                    className="p-1.5 text-center font-bold rounded"
                    style={{
                      background: isCorrect
                        ? `oklch(0.52 0.18 145 / ${0.15 + intensity * 0.7})`
                        : `oklch(0.50 0.22 25 / ${intensity * 0.4})`,
                      color: isCorrect ? "var(--color-healthy)" : val > 0 ? "var(--color-critical)" : "var(--muted-foreground)",
                      minWidth: "48px",
                    }}
                  >
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Metrics() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: metrics, isLoading } = trpc.metrics.get.useQuery();

  if (isLoading) {
    return (
      <div className="page-container flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
        <RefreshCw size={32} className="animate-spin mb-3" style={{ color: "var(--color-forest)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>{t("loading")}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="page-container flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--color-warning-bg)" }}
        >
          <BarChart2 size={36} style={{ color: "var(--color-warning-agri)" }} />
        </div>
        <h2 className="text-lg font-bold mb-2 text-center" style={{ color: "var(--foreground)" }}>
          {lang === "ne" ? "मेट्रिक्स उपलब्ध छैन" : "Metrics Not Available"}
        </h2>
        <p className="text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
          {t("metricsNotReady")}
        </p>
        <div
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "var(--color-warning-bg)", color: "var(--color-warning-agri)" }}
        >
          <RefreshCw size={14} className="animate-spin" />
          {lang === "ne" ? "मोडेल प्रशिक्षण जारी छ..." : "Model training in progress..."}
        </div>
      </div>
    );
  }

  // Map JSON fields correctly
  const overall_metrics = metrics.overall;
  const per_class_metrics = metrics.per_class;
  const confusion_matrix = metrics.confusion_matrix?.matrix;
  const classes = metrics.confusion_matrix?.class_names;
  const training_history = metrics.training_history;
  const dataset_info = metrics.dataset_info;
  const model_info = metrics.model_info;

  // Prepare training chart data
  const trainingData = training_history?.accuracy?.map((acc, i) => ({
    epoch: i + 1,
    [lang === "ne" ? "प्रशिक्षण शुद्धता" : "Train Acc"]: (acc * 100).toFixed(1),
    [lang === "ne" ? "वैधता शुद्धता" : "Val Acc"]: ((training_history.val_accuracy?.[i] || 0) * 100).toFixed(1),
    [lang === "ne" ? "प्रशिक्षण हानि" : "Train Loss"]: (training_history.loss?.[i] || 0).toFixed(3),
    [lang === "ne" ? "वैधता हानि" : "Val Loss"]: (training_history.val_loss?.[i] || 0).toFixed(3),
  })) || [];

  // Per-class bar data
  const classData = per_class_metrics ? Object.entries(per_class_metrics).map(([cls, m]) => ({
    name: cls.split(" ")[0],
    [t("precision")]: (m.precision * 100).toFixed(1),
    [t("recall")]: (m.recall * 100).toFixed(1),
    [t("f1Score")]: ((m.f1 || m.f1_score || 0) * 100).toFixed(1),
  })) : [];

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
        {t("metricsTitle")}
      </h1>

      {/* Overall Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <MetricCard
          label={t("accuracy")}
          value={overall_metrics?.accuracy}
          icon={Target}
          color="var(--color-forest)"
          subtitle={lang === "ne" ? "समग्र शुद्धता" : "Overall accuracy"}
        />
        <MetricCard
          label={t("f1Score")}
          value={overall_metrics?.f1_score}
          icon={Award}
          color="var(--color-healthy)"
          subtitle={lang === "ne" ? "भारित औसत" : "Weighted average"}
        />
        <MetricCard
          label={t("precision")}
          value={overall_metrics?.precision}
          icon={TrendingUp}
          color="var(--color-warning-agri)"
          subtitle={lang === "ne" ? "भारित औसत" : "Weighted average"}
        />
        <MetricCard
          label={t("recall")}
          value={overall_metrics?.recall}
          icon={BarChart2}
          color="var(--color-info)"
          subtitle={lang === "ne" ? "भारित औसत" : "Weighted average"}
        />
      </div>

      {/* Dataset Info */}
      {dataset_info && (
        <div className="agri-card mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} style={{ color: "var(--color-forest)" }} />
            <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
              {t("datasetInfo")}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(dataset_info.class_counts || {}).map(([cls, count]) => (
              <div
                key={cls}
                className="text-center p-2 rounded-xl"
                style={{ background: (CLASS_COLORS[cls] || "var(--color-forest)") + "18" }}
              >
                <div className="text-lg font-bold" style={{ color: CLASS_COLORS[cls] || "var(--color-forest)" }}>
                  {count}
                </div>
                <div className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                  {cls.split(" ")[0]}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-center font-semibold" style={{ color: "var(--muted-foreground)" }}>
            {lang === "ne" ? `कुल: ${dataset_info.total_samples || dataset_info.total_images} तस्वीरहरू` : `Total: ${dataset_info.total_samples || dataset_info.total_images} images`}
          </div>
        </div>
      )}

      {/* Model Info */}
      {model_info && (
        <div className="agri-card mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={16} style={{ color: "var(--color-forest)" }} />
            <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
              {t("modelInfo")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: lang === "ne" ? "आर्किटेक्चर" : "Architecture", value: model_info.architecture },
              { label: lang === "ne" ? "प्यारामिटरहरू" : "Parameters", value: (model_info.parameters || model_info.total_params)?.toLocaleString() },
              { label: lang === "ne" ? "इनपुट आकार" : "Input Size", value: model_info.input_size || model_info.input_shape },
              { label: lang === "ne" ? "इपोकहरू" : "Epochs Trained", value: model_info.epochs_trained },
            ].map(({ label, value }) => (
              <div key={label} className="p-2 rounded-lg" style={{ background: "var(--secondary)" }}>
                <div className="font-semibold mb-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</div>
                <div className="font-bold" style={{ color: "var(--foreground)" }}>{value || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training History Chart */}
      {trainingData.length > 0 && (
        <div className="agri-card mb-5">
          <div className="font-bold text-sm mb-3" style={{ color: "var(--foreground)" }}>
            {t("trainingHistory")} — {lang === "ne" ? "शुद्धता" : "Accuracy"}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trainingData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="epoch" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line
                type="monotone"
                dataKey={lang === "ne" ? "प्रशिक्षण शुद्धता" : "Train Acc"}
                stroke="var(--color-forest)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey={lang === "ne" ? "वैधता शुद्धता" : "Val Acc"}
                stroke="var(--color-healthy)"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-Class Metrics Bar Chart */}
      {classData.length > 0 && (
        <div className="agri-card mb-5">
          <div className="font-bold text-sm mb-3" style={{ color: "var(--foreground)" }}>
            {t("perClassMetrics")}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={classData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey={t("precision")} fill="var(--color-warning-agri)" radius={[3,3,0,0]} />
              <Bar dataKey={t("recall")}    fill="var(--color-info)"         radius={[3,3,0,0]} />
              <Bar dataKey={t("f1Score")}   fill="var(--color-forest)"       radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Confusion Matrix */}
      {confusion_matrix && classes && (
        <div className="agri-card mb-5">
          <div className="font-bold text-sm mb-3" style={{ color: "var(--foreground)" }}>
            {t("confusionMatrix")}
          </div>
          <ConfusionMatrix matrix={confusion_matrix} classes={classes} />
        </div>
      )}
    </div>
  );
}
