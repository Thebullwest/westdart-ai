import React, { useState, useEffect } from 'react';
import { Send, Mail, MessageCircle, FileText, Wand2, Copy, Check, Settings, LogOut, Crown } from 'lucide-react';

const WestdartAI = () => {
  const [activeTab, setActiveTab] = useState('email');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [copied, setCopied] = useState(false);
  
  // User state
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [dailyUsage, setDailyUsage] = useState(0);
  
  // API Key state
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('westdart_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    const today = new Date().toDateString();
    const storedUsage = localStorage.getItem('westdart_usage');
    if (storedUsage) {
      const usageData = JSON.parse(storedUsage);
      if (usageData.date === today) {
        setDailyUsage(usageData.count);
      }
    }
    
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const saveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey);
    setShowApiKeyInput(false);
  };

  const generateWithOpenAI = async (prompt) => {
    if (!apiKey) {
      throw new Error('OpenAI API key required');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional writing assistant. Generate ${tone} content that is ${length} in length.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: length === 'short' ? 150 : length === 'medium' ? 300 : 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const generateContent = async () => {
    if (!user?.isPro && dailyUsage >= 5) {
      setShowUpgrade(true);
      return;
    }

    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    setIsGenerating(true);
    
    try {
      let prompt = '';
      
      if (activeTab === 'email') {
        prompt = `Write a ${tone} email about: ${input}. Include appropriate greeting and closing.`;
      } else if (activeTab === 'social') {
        prompt = `Create a ${tone} social media post about: ${input}. Include relevant hashtags.`;
      } else if (activeTab === 'blog') {
        prompt = `Write a ${length} blog post outline about: ${input}. Include introduction, main points, and conclusion.`;
      }

      const result = await generateWithOpenAI(prompt);
      setOutput(result);
      
      const newUsage = dailyUsage + 1;
      setDailyUsage(newUsage);
      const today = new Date().toDateString();
      localStorage.setItem('westdart_usage', JSON.stringify({
        date: today,
        count: newUsage
      }));
      
    } catch (error) {
      setOutput(`Error: ${error.message}. Please check your API key and try again.`);
    }
    
    setIsGenerating(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const userData = {
      email: loginEmail,
      isPro: loginEmail.includes('pro'),
      name: loginEmail.split('@')[0]
    };
    setUser(userData);
    localStorage.setItem('westdart_user', JSON.stringify(userData));
    setShowLogin(false);
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleSignup = (e) => {
    e.preventDefault();
    const userData = {
      email: loginEmail,
      isPro: false,
      name: loginEmail.split('@')[0]
    };
    setUser(userData);
    localStorage.setItem('westdart_user', JSON.stringify(userData));
    setShowSignup(false);
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('westdart_user');
    setDailyUsage(0);
  };

  const handleUpgrade = () => {
    const upgradedUser = { ...user, isPro: true };
    setUser(upgradedUser);
    localStorage.setItem('westdart_user', JSON.stringify(upgradedUser));
    setShowUpgrade(false);
    alert('Upgrade successful! You now have unlimited generations.');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const tabs = [
    { id: 'email', label: 'Email Assistant', icon: Mail },
    { id: 'social', label: 'Social Media', icon: MessageCircle },
    { id: 'blog', label: 'Blog Writing', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Wand2 className="w-8 h-8 text-indigo-600 mr-2" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Westdart AI
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                {user.isPro && <Crown className="w-5 h-5 text-yellow-500" />}
                <span className="text-gray-700">Hi, {user.name}!</span>
                <button
                  onClick={() => setShowApiKeyInput(true)}
                  className="p-2 text-gray-600 hover:bg-white rounded-lg"
                  title="API Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:bg-white rounded-lg"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-x-2">
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 text-indigo-600 hover:bg-white rounded-lg"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowSignup(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {showApiKeyInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">OpenAI API Configuration</h3>
              <p className="text-gray-600 mb-4 text-sm">
                To use real AI generation, enter your OpenAI API key. Get one at platform.openai.com
              </p>
              <input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-3 border rounded-lg mb-4"
              />
              <div className="flex space-x-3">
                <button
                  onClick={saveApiKey}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowApiKeyInput(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showLogin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Login to Westdart AI</h3>
              <form onSubmit={handleLogin}>
                <input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full p-3 border rounded-lg mb-3"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg mb-4"
                  required
                />
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogin(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              <p className="text-sm text-gray-600 mt-3 text-center">
                Try "pro@test.com" for pro account demo
              </p>
            </div>
          </div>
        )}

        {showSignup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Sign Up for Westdart AI</h3>
              <form onSubmit={handleSignup}>
                <input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full p-3 border rounded-lg mb-3"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg mb-4"
                  required
                />
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSignup(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showUpgrade && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Upgrade to Pro</h3>
                <p className="text-gray-600 mb-6">
                  You've reached your daily limit of 5 free generations.
                </p>
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-lg mb-2">Pro Features:</h4>
                  <ul className="text-left space-y-1 text-gray-700">
                    <li>✅ Unlimited AI generations</li>
                    <li>✅ Priority support</li>
                    <li>✅ Advanced tone options</li>
                    <li>✅ Export to multiple formats</li>
                  </ul>
                </div>
                <div className="text-center mb-6">
                  <span className="text-3xl font-bold">$4.99</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleUpgrade}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold"
                  >
                    Upgrade Now
                  </button>
                  <button
                    onClick={() => setShowUpgrade(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {user && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-lg p-1 shadow-md">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-4 py-2 rounded-md transition-all ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  {activeTab === 'email' && 'Describe your email'}
                  {activeTab === 'social' && 'What do you want to share?'}
                  {activeTab === 'blog' && 'Blog topic or outline'}
                </h2>
                
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    activeTab === 'email' 
                      ? "e.g., I need to follow up on our meeting about the project timeline..."
                      : activeTab === 'social'
                      ? "e.g., Just launched my new project and feeling excited..."
                      : "e.g., How to improve productivity while working from home"
                  }
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                    <select
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={generateContent}
                  disabled={!input.trim() || isGenerating}
                  className="w-full mt-6 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Generated Content</h2>
                  {output && (
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-1 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                <div className="min-h-64 p-4 bg-gray-50 rounded-lg border">
                  {output ? (
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                      {output}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">
                      Your generated content will appear here...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {!user.isPro && (
              <div className="mt-6 bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="mb-4">
                  <p className="text-gray-600">Daily Usage: <span className="font-semibold">{dailyUsage}/5</span> free generations</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{width: `${(dailyUsage/5)*100}%`}}></div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowUpgrade(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 font-semibold"
                >
                  Upgrade to Pro - Unlimited Generations $4.99/month
                </button>
              </div>
            )}
          </>
        )}

        {!user && (
          <div className="text-center bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Westdart AI</h2>
            <p className="text-gray-600 mb-6">
              Your intelligent writing companion for emails, social media, and blog content.
            </p>
            <button
              onClick={() => setShowSignup(true)}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-semibold"
            >
              Get Started Free
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WestdartAI;
