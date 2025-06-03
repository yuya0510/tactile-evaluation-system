import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const evaluationCategories = {
  "硬軟感": ["硬い", "柔らかい", "弾力がある", "もっちりしている", "ふかふかしている", "ゴツゴツしている", "しなやか"],
  "粗滑感": ["粗い", "滑らか", "ザラザラしている", "ツルツルしている", "ヌルヌルしている", "サラサラしている"],
  "摩擦感": ["摩擦が大きい", "摩擦が小さい", "引っかかる", "滑る"],
  "温冷感": ["温かい", "冷たい", "ひんやりする", "じんわり温かい", "熱い", "冷え冷えする"],
  "高級感": ["高級感がある", "安っぽい", "上品", "重厚感がある", "繊細"],
};

function App() {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTerms, setSelectedTerms] = useState([]);
  const [generatedFormHtml, setGeneratedFormHtml] = useState('');
  const [collectedResponses, setCollectedResponses] = useState([]);
  const [currentMockResponse, setCurrentMockResponse] = useState({});
  const [respondentIdCounter, setRespondentIdCounter] = useState(1);

  const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'data'

  const availableTerms = Array.from(
    new Set(
      selectedCategories.flatMap(category => evaluationCategories[category] || [])
    )
  );

  const handleCategoryCheckboxChange = (event) => {
    const category = event.target.value;
    if (event.target.checked) {
      setSelectedCategories((prevCategories) => [...prevCategories, category]);
    } else {
      setSelectedCategories((prevCategories) =>
        prevCategories.filter((c) => c !== category)
      );
    }
    setSelectedTerms([]);
    setGeneratedFormHtml('');
    setCollectedResponses([]);
    setCurrentMockResponse({});
    setRespondentIdCounter(1);
  };

  const handleTermChange = (event) => {
    const term = event.target.value;
    if (event.target.checked) {
      setSelectedTerms((prevTerms) => [...prevTerms, term]);
    } else {
      setSelectedTerms((prevTerms) => prevTerms.filter((t) => t !== term));
    }
  };

  const generateFormHtml = () => {
    if (selectedTerms.length === 0) {
      alert("評価語を一つ以上選択してください。");
      return;
    }

    const formQuestionsHtml = selectedTerms.map((term, index) => {
      const groupName = `question_${index + 1}_${term.replace(/\s/g, '_')}`;
      return `
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 8px; background-color: #f9f9f9;">
          <p style="font-weight: bold; margin-bottom: 10px;">質問${index + 1}. 評価語「${term}」は、これらのサンプルを触って違いが分かると思いますか？</p>
          <label style="margin-right: 20px;">
            <input type="radio" name="${groupName}" value="はい" required> はい
          </label>
          <label>
            <input type="radio" name="${groupName}" value="いいえ" required> いいえ
          </label>
        </div>
      `;
    }).join('');

    const generatedHtml = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>触感官能評価アンケート</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background-color: #f0f2f5; color: #333; }
              .container { max-width: 800px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              h1 { color: #333; text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 15px; }
              button { background-color: #4CAF50; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 20px; display: block; width: 100%; transition: background-color 0.3s ease; }
              button:hover { background-color: #45a049; }
              p.note { margin-top: 30px; font-size: 0.9em; color: #666; text-align: center; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>触感官能評価アンケート</h1>
              <form action="#" method="post">
                  ${formQuestionsHtml}
                  <button type="submit">回答を送信</button>
              </form>
              <p class="note">※このアンケートは、評価語がサンプル間の違いを識別するのに適切かどうかを確認するためのものです。</p>
          </div>
      </body>
      </html>
    `;
    setGeneratedFormHtml(generatedHtml);
  };

  const openFormInNewTab = () => {
    if (generatedFormHtml) {
      const blob = new Blob([generatedFormHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else {
      alert("先にアンケートフォームを生成してください。");
    }
  };

  const handleMockResponseChange = (term, value) => {
    setCurrentMockResponse((prev) => ({
      ...prev,
      [term]: value,
    }));
  };

  const handleRecordResponse = () => {
    if (Object.keys(currentMockResponse).length !== selectedTerms.length || selectedTerms.some(term => !currentMockResponse[term])) {
        alert("全ての評価語に回答してください。");
        return;
    }

    const responseWithId = {
      回答者ID: respondentIdCounter,
      ...currentMockResponse
    };

    setCollectedResponses((prev) => [...prev, responseWithId]);
    setRespondentIdCounter((prev) => prev + 1);
    setCurrentMockResponse({});
    alert(`回答者ID ${respondentIdCounter} の回答を記録しました！`);
  };

  const handleDownloadExcel = () => {
    if (collectedResponses.length === 0) {
      alert("記録された回答がありません。");
      return;
    }

    const header = ['回答者ID', ...selectedTerms];

    const data = collectedResponses.map(response => {
      const row = {};
      header.forEach(key => {
        row[key] = response[key] || '';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data, { header: header });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "官能評価回答");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, `官能評価回答_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '-')}.xlsx`);

    alert("Excelファイルがダウンロードされました！");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8 flex items-center justify-center font-inter">
      <div className="bg-white p-6 sm:p-10 rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-6 text-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
            触感官能評価システム
          </span>
        </h1>
        <p className="text-gray-600 text-center mb-8 text-sm sm:text-base">
          官能評価実験のプロセスをサポートします。
        </p>

        {/* タブナビゲーション */}
        <div className="flex justify-center mb-8 bg-gray-100 p-2 rounded-lg shadow-sm">
          <button
            className={`py-2 px-6 rounded-md font-semibold text-lg transition-colors duration-200 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            アンケート設定
          </button>
          <button
            className={`ml-4 py-2 px-6 rounded-md font-semibold text-lg transition-colors duration-200 ${
              activeTab === 'data'
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('data')}
          >
            回答入力・管理
          </button>
        </div>

        {/* アンケート設定タブの内容 */}
        {activeTab === 'settings' && (
          <div>
            {/* 評価カテゴリの選択セクション（複数選択） */}
            <div className="mb-8 p-5 bg-blue-50 rounded-lg shadow-inner">
              <h2 className="text-xl sm:text-2xl font-semibold text-blue-800 mb-4 flex items-center">
                <svg className="w-3 h-3 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                評価カテゴリの選択（複数選択可）
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.keys(evaluationCategories).map((category) => (
                  <label key={category} className="flex items-center p-2 bg-white rounded-md shadow-sm cursor-pointer hover:bg-blue-100 transition-colors duration-200">
                    <input
                      type="checkbox"
                      value={category}
                      checked={selectedCategories.includes(category)}
                      onChange={handleCategoryCheckboxChange}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-800 text-sm sm:text-base">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 評価語の選択セクション */}
            {selectedCategories.length > 0 && (
              <div className="mb-8 p-5 bg-green-50 rounded-lg shadow-inner">
                <h2 className="text-xl sm:text-2xl font-semibold text-green-800 mb-4 flex items-center">
                  <svg className="w-3 h-3 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  評価語の選択
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableTerms.map((term) => (
                    <label key={term} className="flex items-center p-2 bg-white rounded-md shadow-sm cursor-pointer hover:bg-green-100 transition-colors duration-200">
                      <input
                        type="checkbox"
                        value={term}
                        checked={selectedTerms.includes(term)}
                        onChange={handleTermChange}
                        className="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="ml-2 text-gray-800 text-sm sm:text-base">{term}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={generateFormHtml}
                  className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-bold text-lg shadow-md hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
                >
                  アンケートフォームを生成
                </button>
              </div>
            )}

            {/* 生成されたアンケートフォームの表示とリンク */}
            {generatedFormHtml && (
              <div className="p-5 bg-yellow-50 rounded-lg shadow-inner">
                <h2 className="text-xl sm:text-2xl font-semibold text-yellow-800 mb-4 flex items-center">
                  <svg className="w-3 h-3 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                  生成されたアンケートフォーム
                </h2>
                <p className="text-gray-700 mb-3 text-sm sm:text-base">
                  以下のHTMLコードをコピーして、`index.html` ファイルなどとして保存すると、アンケートフォームとして利用できます。
                </p>
                <textarea
                  className="w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800 bg-gray-50 font-mono text-xs overflow-auto resize-y"
                  readOnly
                  value={generatedFormHtml}
                ></textarea>
                <button
                  onClick={openFormInNewTab}
                  className="mt-4 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-bold text-lg shadow-md hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75"
                >
                  新しいタブでフォームを開く (確認用)
                </button>
                <p className="mt-4 text-gray-600 text-sm italic">
                  ※このフォームはあくまで生成・表示用であり、**回答を送信する機能は含まれていません。** 回答の収集は別途行う必要があります。
                </p>
              </div>
            )}
          </div>
        )}

        {/* 回答入力・管理タブの内容 */}
        {activeTab === 'data' && (
          <div>
            {selectedTerms.length > 0 ? (
              <div className="p-5 bg-purple-50 rounded-lg shadow-inner">
                <h2 className="text-xl sm:text-2xl font-semibold text-purple-800 mb-4 flex items-center">
                  <svg className="w-3 h-3 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  回答結果の模擬入力と管理
                </h2>
                <p className="text-gray-700 mb-4 text-sm sm:text-base">
                  アンケートの回答を一つずつ入力し、記録できます。
                </p>

                <div className="space-y-4 mb-6 p-4 border border-purple-200 rounded-md bg-white">
                  <h3 className="font-bold text-lg text-purple-700">回答者ID: {respondentIdCounter}</h3>
                  {selectedTerms.map((term) => (
                    <div key={term} className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <span className="font-medium text-gray-700 sm:w-1/2">{term}：</span>
                      <div className="flex items-center space-x-4 mt-1 sm:mt-0 sm:w-1/2">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name={`mock_q_${term}`}
                            value="はい"
                            checked={currentMockResponse[term] === 'はい'}
                            onChange={() => handleMockResponseChange(term, 'はい')}
                            className="form-radio h-4 w-4 text-purple-600"
                          />
                          <span className="ml-2 text-gray-700">はい</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name={`mock_q_${term}`}
                            value="いいえ"
                            checked={currentMockResponse[term] === 'いいえ'}
                            onChange={() => handleMockResponseChange(term, 'いいえ')}
                            className="form-radio h-4 w-4 text-purple-600"
                          />
                          <span className="ml-2 text-gray-700">いいえ</span>
                        </label>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleRecordResponse}
                    className="mt-6 w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-bold text-lg shadow-md hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
                  >
                    この回答を記録
                  </button>
                </div>

                {/* 記録された回答の表示（簡易） */}
                {collectedResponses.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-bold text-lg text-purple-700 mb-3">記録済みの回答:</h3>
                    <ul className="list-none p-0 space-y-2">
                      {collectedResponses.map((response, idx) => (
                        <li key={idx} className="bg-white p-3 rounded-md shadow-sm text-sm text-gray-800">
                          <strong>回答者ID {response['回答者ID']}：</strong>
                          {Object.entries(response).filter(([key]) => key !== '回答者ID').map(([term, answer]) => (
                            <span key={term} className="ml-3">
                              {term}: <span className="font-semibold">{answer}</span>
                            </span>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={handleDownloadExcel}
                  className="mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-bold text-lg shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
                >
                  Excelとしてダウンロード
                </button>
                <p className="mt-4 text-gray-600 text-sm italic">
                  ※この機能は、アンケート回答をこのページで模擬的に入力し、Excelファイルとして出力するものです。
                  実際のWebフォームからの自動データ収集ではありません。
                </p>
              </div>
            ) : (
              <div className="p-5 bg-red-50 rounded-lg shadow-inner text-center">
                <p className="text-red-700 font-semibold text-lg">
                  「アンケート設定」タブでカテゴリと評価語を選択してください。
                </p>
                <p className="text-red-600 text-sm mt-2">
                  回答入力・管理を行うには、アンケートの項目が必要です。
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;