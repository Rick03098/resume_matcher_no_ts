import React, { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';

const AIRTABLE_API_KEY = 'patCOFt5DYSAv73VI.a27ea50b39361b388fe941cd6b562518a08f7943631c2deddd479a8bb1ba6d38';
const BASE_ID = 'appYPoERDFlNulJgi';
const TABLE_NAME = 'resumepool';

export default function Home() {
  const [jd, setJd] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.records) return;
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-indigo-700">智能简历匹配系统</h1>
        <Card>
          <CardContent className="space-y-4 p-6">
            <label className="text-sm font-medium text-gray-700">请输入岗位 JD：</label>
            <Textarea
              className="h-36"
              placeholder="粘贴你的岗位描述（支持中文和英文关键词）"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
            <Button onClick={handleMatch} className="w-full">
              ⚡ 开始匹配
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card className="shadow border">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">🎯 匹配结果：</h2>
              <Table className="text-sm">
                <TableHead>
                  <TableRow className="bg-slate-100">
                    <TableCell>排名</TableCell>
                    <TableCell>候选人</TableCell>
                    <TableCell>匹配分数</TableCell>
                    <TableCell>技能关键词</TableCell>
                    <TableCell>推荐理由</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((r, i) => (
                    <TableRow key={r.name} className={i === 0 ? 'bg-green-50' : ''}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.finalScore.toFixed(1)}</TableCell>
                      <TableCell>{r.skills}</TableCell>
                      <TableCell>{r.summary}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
