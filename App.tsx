
import React, { useState } from 'react';
import { processPdf } from './services/pdfService';
import { SplitResult, ProcessingStatus } from './types';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<SplitResult[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>({
    step: 'idle',
    progress: 0,
    message: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults([]);
      setStatus({ step: 'idle', progress: 0, message: '' });
    }
  };

  const startProcessing = async () => {
    if (!file) return;
    
    try {
      const splitResults = await processPdf(file, (newStatus) => {
        setStatus(newStatus);
      });
      setResults(splitResults);
    } catch (err) {
      console.error(err);
    }
  };

  const reset = () => {
    setFile(null);
    setResults([]);
    setStatus({ step: 'idle', progress: 0, message: '' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 bg-slate-50">
      <header className="max-w-3xl w-full text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-200">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Splitter Automático de Cidades
        </h1>
        <p className="text-lg text-slate-600">
          Identifica cabeçalhos e separa páginas por localidade via processamento de texto.
        </p>
      </header>

      <main className="max-w-4xl w-full">
        {status.step === 'idle' && (
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 transition-all">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-12 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-slate-700">Anexar PDF da Tabela</span>
                <span className="text-sm text-slate-500 mt-1">Busca automática por padrões de cidade</span>
              </label>
            </div>

            {file && (
              <div className="mt-8 flex flex-col items-center">
                <div className="flex items-center space-x-3 p-4 bg-emerald-50/50 rounded-xl w-full mb-6 border border-emerald-100">
                  <div className="bg-emerald-600 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                    </svg>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button 
                    onClick={() => setFile(null)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18" />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={startProcessing}
                  className="w-full py-4 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-0.5"
                >
                  Separar Documento por Cidades
                </button>
              </div>
            )}
          </div>
        )}

        {(status.step !== 'idle' && status.step !== 'completed') && (
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-slate-700">
                  {status.progress}%
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Processando PDF</h3>
              <p className="text-slate-600 font-medium">{status.message}</p>
            </div>
          </div>
        )}

        {status.step === 'completed' && results.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Arquivos Gerados</h3>
                <p className="text-slate-500">{results.length} localizações encontradas</p>
              </div>
              <button 
                onClick={reset}
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-4 py-2 rounded-lg"
              >
                Novo Processamento
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result, idx) => (
                <div 
                  key={idx}
                  className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-slate-100 p-3 rounded-xl group-hover:bg-emerald-50 transition-colors">
                      <svg className="w-6 h-6 text-slate-600 group-hover:text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-bold text-slate-900">{result.cityName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono tracking-widest">{result.pageCount} {result.pageCount === 1 ? 'PÁGINA' : 'PÁGINAS'}</p>
                    </div>
                  </div>
                  <a
                    href={result.pdfUrl}
                    download={`${result.cityName}.pdf`}
                    className="p-3 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-emerald-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {status.step === 'error' && (
          <div className="bg-red-50 rounded-3xl p-8 border border-red-100 text-center">
            <h3 className="text-xl font-bold text-red-900 mb-2">Erro no Processamento</h3>
            <p className="text-red-700 mb-6">{status.message}</p>
            <button 
              onClick={reset}
              className="bg-white px-6 py-2 rounded-xl text-red-600 font-bold border border-red-200 hover:bg-red-50"
            >
              Tentar Novamente
            </button>
          </div>
        )}
      </main>

      <footer className="mt-auto pt-12 text-slate-400 text-sm">
        Processamento local e algorítmico de arquivos.
      </footer>
    </div>
  );
}
