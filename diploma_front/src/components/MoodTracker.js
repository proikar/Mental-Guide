import React, { useState, useEffect, useCallback } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Box,
  Chip,
  Divider,
  Paper,
} from "@mui/material";
import {
  Mood as MoodIcon,
  SentimentNeutral as SentimentNeutralIcon,
  SentimentDissatisfied as SentimentDissatisfiedIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { getCurrentMood, getMoodHistory } from "../api/moodApi";
import { t } from "../utils/i18n";
import "./MoodTracker.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MoodTracker = ({ sidebarOpen, settings }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [currentMood, history] = await Promise.all([
        getCurrentMood(),
        getMoodHistory(10),
      ]);

      setData({
        analysis: currentMood,
        history: history,
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || t('dataLoadError', settings.language));
    } finally {
      setLoading(false);
    }
  }, [settings.language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => fetchData();

  const getMoodColor = (score) => {
    if (typeof score !== "number") return "neutral";
    if (score > 0.3) return "positive";
    if (score < -0.3) return "negative";
    return "neutral";
  };

  const parseKeywords = (keywords) => {
    try {
      return Array.isArray(keywords) ? keywords : JSON.parse(keywords || "[]");
    } catch {
      return [];
    }
  };

  const moodData = data?.analysis || {};
  const moodScore = moodData.mood_score || 0;
  const moodType = getMoodColor(moodScore);
  const keywords = parseKeywords(moodData.keywords);
  const historyData = data?.history || [];

  const MoodIconComponent = {
    positive: MoodIcon,
    negative: SentimentDissatisfiedIcon,
    neutral: SentimentNeutralIcon,
  }[moodType];

  return (
    <Container className={`mood-tracker-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Box className="header-section">
        <Typography variant="h4" className="title">
          {t('aiMoodAnalyzer', settings.language)}
        </Typography>
        <Box className="refresh-section">
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            className="refresh-button"
          >
            {t('refresh', settings.language)}
          </Button>
          {lastUpdated && (
            <Typography className="last-updated">
              {t('lastUpdated', settings.language)}: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box className="loading-section">
          <CircularProgress />
          <Typography>{t('moodAnalysisLoading', settings.language)}</Typography>
        </Box>
      ) : error ? (
        <Box className="error-section">
          <Alert severity="error">{error}</Alert>
          <Button
            variant="contained"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
          >
            {t('tryAgain', settings.language)}
          </Button>
        </Box>
      ) : (
        <>
          <Paper className="mood-summary">
            <Box className="mood-header">
              <MoodIconComponent className={`mood-icon ${moodType}`} />
              <Box>
                <Typography variant="h6">{t('currentMood', settings.language)}</Typography>
                <Typography className={`mood-text ${moodType}`}>
                  {t(moodType, settings.language)}
                </Typography>
              </Box>
            </Box>

            <Divider className="divider" />

            <Box className="mood-details">
              <Box className="score-section">
                <Typography variant="subtitle1">{t('score', settings.language)}</Typography>
                <Chip
                  label={moodScore.toFixed(2)}
                  className={`score-chip ${moodType}`}
                />
              </Box>
              <Box className="keywords-section">
                <Typography variant="subtitle1">{t('keywords', settings.language)}</Typography>
                <Box className="keywords-list">
                  {Array.isArray(keywords) && keywords.length > 0 ? (
                    keywords.map((word, i) => (
                      <Chip key={i} label={word} className="keyword-chip" />
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      {t('noKeywords', settings.language)}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>

          <Paper className="history-chart">
            <Typography variant="h6">{t('moodHistory', settings.language)}</Typography>
            <Line
              data={{
                labels: historyData.map((item) =>
                  new Date(item.created_at).toLocaleDateString(settings.language, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                ),
                datasets: [
                  {
                    label: t('moodLevel', settings.language),
                    data: historyData.map((item) => item.mood_score || 0),
                    borderColor: "#4bc0c0",
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    tension: 0.1,
                  },
                ],
              }}
              options={{
                responsive: true,
                scales: {
                  y: {
                    min: -1,
                    max: 1,
                    ticks: {
                      stepSize: 0.5,
                      callback: (value) => {
                        const emojis = {
                          1: t('veryPositive', settings.language),
                          0.5: t('positive', settings.language),
                          0: t('neutral', settings.language),
                          "-0.5": t('negative', settings.language),
                          "-1": t('veryNegative', settings.language),
                        };
                        return `${emojis[value]} (${value})`;
                      },
                    },
                  },
                },
              }}
            />
          </Paper>
        </>
      )}
    </Container>
  );
};

export default MoodTracker;
