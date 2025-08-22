import { SentimentAnalyzer } from './src/lib/ai/analyzers/SentimentAnalyzer';
import { RiskAnalyzer } from './src/lib/ai/analyzers/RiskAnalyzer';

async function debugAnalyzers() {
  console.log('=== SentimentAnalyzer Debug ===');
  try {
    const sentimentAnalyzer = new SentimentAnalyzer();
    const sentimentResult = await sentimentAnalyzer.analyze('AAPL');
    console.log('SentimentAnalyzer result:', {
      analysis: sentimentResult.analysis,
      sentiment_label: sentimentResult.sentiment_label,
    });

    const safePhrases = [
      '倾向',
      '情景',
      '可能',
      '预期',
      '建议',
      '考虑',
      '关注',
      '观察',
      '分析',
      '评估',
    ];
    const containsSafePhrases = safePhrases.some(phrase =>
      sentimentResult.analysis.toLowerCase().includes(phrase.toLowerCase())
    );
    console.log('Contains safe phrases:', containsSafePhrases);
    console.log(
      'Safe phrases found:',
      safePhrases.filter(phrase =>
        sentimentResult.analysis.toLowerCase().includes(phrase.toLowerCase())
      )
    );
  } catch (error) {
    console.error('SentimentAnalyzer error:', error);
  }

  console.log('\n=== RiskAnalyzer Debug ===');
  try {
    const riskAnalyzer = new RiskAnalyzer();
    const riskResult = await riskAnalyzer.analyze('AAPL');
    console.log('RiskAnalyzer result:', {
      analysis: riskResult.analysis,
      overall_risk_level: riskResult.overall_risk_level,
      risk_warnings: riskResult.risk_warnings,
      risk_mitigation: riskResult.risk_mitigation,
    });

    const textToCheck = [
      riskResult.analysis,
      ...(Array.isArray(riskResult.risk_warnings)
        ? riskResult.risk_warnings
        : [riskResult.risk_warnings || '']),
      ...(Array.isArray(riskResult.risk_mitigation)
        ? riskResult.risk_mitigation
        : [riskResult.risk_mitigation || '']),
    ].join(' ');

    const safePhrases = [
      '倾向',
      '情景',
      '可能',
      '预期',
      '建议',
      '考虑',
      '关注',
      '观察',
      '分析',
      '评估',
    ];
    const containsSafePhrases = safePhrases.some(phrase =>
      textToCheck.toLowerCase().includes(phrase.toLowerCase())
    );
    console.log('Contains safe phrases:', containsSafePhrases);
    console.log(
      'Safe phrases found:',
      safePhrases.filter(phrase =>
        textToCheck.toLowerCase().includes(phrase.toLowerCase())
      )
    );
  } catch (error) {
    console.error('RiskAnalyzer error:', error);
  }
}

debugAnalyzers().catch(console.error);
