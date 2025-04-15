import React, { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';

const AIRTABLE_API_KEY = 'patCOFt5DYSAv73VI.a27ea50b39361b388fe941cd6b562518a08f7943631c2deddd479a8bb1ba6d38';
const BASE_ID = 'appYPoERDFlNulJgi';
const TABLE_NAME = 'resumepool';
const OPENAI_API_KEY = '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';

export default function Home() {
  const [jd, setJd] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState([]);
  const [pdfText, setPdfText] = useState('');

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

  const extractKeywords = async (text) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是招聘专家，请从岗位JD中提取关键词（技能、要求、能力），使用中文逗号分隔输出，不要多余文字。'
          },
          {
            role: 'user',
            content: text
          }
        ]
      })
    });
    const result = await response.json();
    return result.choices?.[0]?.message?.content?.split(/[,，\s]+/) || [];
  };

  const generateSummary = async (candidate, jdText) => {
    const prompt = `岗位描述：${jdText}\n\n候选人信息：${candidate.skills}，综合评分：${candidate.score}。\n请根据岗位需求与候选人技能简要说明匹配原因（50字以内）`;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '你是专业的HR助理，请简洁生成推荐理由。' },
          { role: 'user', content: prompt }
        ]
      })
    });
    const result = await res.json();
    return result.choices?.[0]?.message?.content || '';
  };

  const handleMatch = async () => {
    const keywords = await extractKeywords(jd);
    const scored = await Promise.all(
      candidates.map(async (c) => {
        const matchScore = keywords.reduce((sum, k) => (c.skills.includes(k) ? sum + 2 : sum), 0);
        const finalScore = matchScore + c.score;
        const summary = await generateSummary(c, jd);
        return { ...c, finalScore, summary };
      })
    );
    scored.sort((a, b) => b.finalScore - a.finalScore);
    setResults(scored);
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const pdfData = reader.result;
      const pdfjsLib = await import('pdfjs-dist/build/pdf');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item) => item.str).join(' ');
      }
      setPdfText(text);
      alert('✅ PDF 简历已读取完成');
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-indigo-700 tracking-tight">📄 智能简历匹配系统</h1>
        <Card className="shadow-lg">
          <CardContent className="space-y-6 p-6">
            <Textarea
              className="h-36 text-base border border-gray-300 rounded-md"
              placeholder="请输入岗位 JD（支持中文/英文），支持关键词提取和推荐理由生成"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
            <div className="flex items-center gap-4">
              <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="text-sm" />
              <Button onClick={handleMatch} className="ml-auto w-40 bg-indigo-600 hover:bg-indigo-700 text-white">
                ⚡ 开始智能匹配
              </Button>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card className="shadow-xl">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-slate-800">🎯 匹配结果推荐</h2>
              <Table className="text-sm border rounded-md overflow-hidden">
                <TableHead>
                  <TableRow className="bg-slate-200 text-slate-700">
                    <TableCell className="font-bold">排名</TableCell>
                    <TableCell className="font-bold">候选人</TableCell>
                    <TableCell className="font-bold">匹配分数</TableCell>
                    <TableCell className="font-bold">技能关键词</TableCell>
                    <TableCell className="font-bold">推荐理由（AI 生成）</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((r, i) => (
                    <TableRow key={r.name} className={i === 0 ? 'bg-green-50' : 'hover:bg-slate-50'}>
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
