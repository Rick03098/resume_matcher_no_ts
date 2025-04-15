import React, { useEffect, useState } from 'react';

export default function Home() {
  const [jd, setJd] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState([]);

  const AIRTABLE_API_KEY = 'patHeHHPvRvGPpMUs.ceb12dd3bb28a8e1bee58e6c82b205f8f1627cf7458c1fbb077acfdbaabd5aba';
  const BASE_ID = 'appYPoERDFlNulJgi';
  const TABLE_NAME = 'resume pool';

  useEffect(() => {
    fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    })
      .then((res) => res.json())
      .then((data) => {
        const parsed = data.records.map((rec) => ({
          name: rec.fields.name || '',
          score: rec.fields.score || 0,
          skills: rec.fields.skills || '',
          summary: rec.fields.summary || ''
        }));
        setCandidates(parsed);
      });
  }, []);

  const handleMatch = () => {
    const keywords = jd.split(/[,，。;；\s]+/);
    const scored = candidates
      .map((c) => {
        const matchScore = keywords.reduce((sum, k) => (c.skills.includes(k) ? sum + 2 : sum), 0);
        return { ...c, finalScore: matchScore + c.score };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
    setResults(scored);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold' }}>智能简历匹配系统</h1>
      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        rows="10"
        placeholder="请输入岗位 JD"
        style={{ width: '100%', marginTop: 12 }}
      />
      <button onClick={handleMatch} style={{ marginTop: 8, padding: 8 }}>
        ⚡ 开始匹配
      </button>
      {results.length > 0 && (
        <table border="1" cellPadding="6" style={{ marginTop: 20, width: '100%' }}>
          <thead>
            <tr>
              <th>排名</th>
              <th>候选人</th>
              <th>匹配分数</th>
              <th>技能关键词</th>
              <th>推荐理由</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={r.name}>
                <td>{i + 1}</td>
                <td>{r.name}</td>
                <td>{r.finalScore}</td>
                <td>{r.skills}</td>
                <td>{r.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
