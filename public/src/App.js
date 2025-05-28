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
    { id: 'blog', la
