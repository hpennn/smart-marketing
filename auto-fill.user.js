// ==UserScript==
// @name         智能营销 - 一键填写
// @namespace    smart-marketing-auto-fill
// @version      1.0.0
// @description  配合智能营销平台，在社交平台发布页自动填入文案内容
// @match        https://weibo.com/*
// @match        https://creator.xiaohongshu.com/*
// @match        https://www.zhihu.com/*
// @match        https://member.bilibili.com/*
// @match        https://mp.toutiao.com/*
// @match        https://creator.douyin.com/*
// @match        https://mp.weixin.qq.com/*
// @match        https://web.okjike.com/*
// @match        https://work.weixin.qq.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
(function() {
    'use strict';

    // ===== 从 URL hash 读取内容 =====
    function getPayload() {
        const hash = window.location.hash;
        if (!hash || !hash.startsWith('#smfill=')) return null;
        try {
            const json = decodeURIComponent(hash.slice(8));
            // 清除 hash
            history.replaceState(null, '', window.location.pathname + window.location.search);
            return JSON.parse(json);
        } catch(e) {
            console.warn('[智能营销] 解析内容失败:', e);
            return null;
        }
    }

    // ===== 平台检测 =====
    function detectPlatform() {
        const h = location.hostname;
        const p = location.pathname;
        if (h.includes('weibo.com')) return 'weibo';
        if (h.includes('xiaohongshu.com')) return 'xiaohongshu';
        if (h.includes('zhihu.com')) return 'zhihu';
        if (h.includes('bilibili.com')) return 'bilibili';
        if (h.includes('toutiao.com')) return 'toutiao';
        if (h.includes('douyin.com')) return 'douyin';
        if (h.includes('mp.weixin.qq.com')) return 'wechat';
        if (h.includes('okjike.com')) return 'jike';
        return null;
    }

    // ===== DOM 工具 =====
    function waitFor(selector, timeout = 15000) {
        return new Promise(resolve => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) { observer.disconnect(); resolve(el); }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
        });
    }

    function setInputValue(el, value) {
        const proto = el.tagName === 'TEXTAREA'
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(el, value);
        else el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function fillContenteditable(el, text) {
        el.focus();
        el.innerHTML = '';
        // 按段落插入
        const paragraphs = text.split('\n').filter(p => p.trim());
        paragraphs.forEach((p, i) => {
            const div = document.createElement('div');
            div.textContent = p;
            el.appendChild(div);
        });
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 模拟键盘粘贴
    function pasteText(el, text) {
        el.focus();
        const dt = new DataTransfer();
        dt.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true, cancelable: true, clipboardData: dt
        });
        el.dispatchEvent(pasteEvent);
    }

    // ===== 各平台填写逻辑 =====

    async function fillWeibo(payload) {
        // 微博首页发布框
        const textarea = await waitFor('textarea[class*="Form_input"]');
        if (textarea) {
            setInputValue(textarea, payload.content);
            showNotice('✅ 微博内容已自动填入');
            return true;
        }
        // 备选：contenteditable
        const ce = await waitFor('div[contenteditable="true"]');
        if (ce) {
            fillContenteditable(ce, payload.content);
            showNotice('✅ 微博内容已自动填入');
            return true;
        }
        return false;
    }

    async function fillXiaohongshu(payload) {
        // 小红书创作者中心 - 文章/笔记编辑
        // 标题
        const titleInput = await waitFor('input[placeholder*="标题"], input[class*="title"], [class*="title"] input, [class*="Title"] input');
        if (titleInput && payload.title) {
            setInputValue(titleInput, payload.title);
        }
        // 正文
        const editor = await waitFor('[contenteditable="true"][class*="editor"], [contenteditable="true"][class*="content"], div.ql-editor, [class*="Editor"] [contenteditable="true"]');
        if (editor) {
            fillContenteditable(editor, payload.content);
            showNotice('✅ 小红书内容已自动填入');
            return true;
        }
        // 备选：textarea
        const ta = await waitFor('textarea[placeholder*="正文"], textarea[placeholder*="输入"]');
        if (ta) {
            setInputValue(ta, payload.content);
            showNotice('✅ 小红书内容已自动填入');
            return true;
        }
        return false;
    }

    async function fillZhihu(payload) {
        // 知乎 - 写文章/回答
        const editor = await waitFor('[contenteditable="true"].public-DraftEditor-content, div[class*="DraftEditor"]');
        if (editor) {
            fillContenteditable(editor, payload.content);
            showNotice('✅ 知乎内容已自动填入');
            return true;
        }
        // 写回答场景
        const textarea = await waitFor('textarea[class*="Editor"], textarea[placeholder*="写回答"]');
        if (textarea) {
            setInputValue(textarea, payload.content);
            showNotice('✅ 知乎内容已自动填入');
            return true;
        }
        return false;
    }

    async function fillBilibili(payload) {
        // B站专栏 - ProseMirror 编辑器
        const editor = await waitFor('.ProseMirror[contenteditable="true"], div[contenteditable="true"][class*="editor"]');
        if (editor) {
            fillContenteditable(editor, payload.content);
            showNotice('✅ B站内容已自动填入');
            return true;
        }
        // 动态发布
        const ta = await waitFor('textarea[placeholder*="动态"], textarea[placeholder*="想法"]');
        if (ta) {
            setInputValue(ta, payload.content);
            showNotice('✅ B站内容已自动填入');
            return true;
        }
        return false;
    }

    async function fillToutiao(payload) {
        // 头条号文章编辑器
        const titleInput = await waitFor('input[placeholder*="标题"], textarea[placeholder*="标题"]');
        if (titleInput && payload.title) {
            if (titleInput.tagName === 'TEXTAREA') setInputValue(titleInput, payload.title);
            else setInputValue(titleInput, payload.title);
        }
        const editor = await waitFor('[contenteditable="true"][class*="editor"], .ProseMirror, div[class*="article"] [contenteditable="true"]');
        if (editor) {
            fillContenteditable(editor, payload.content);
            showNotice('✅ 头条号内容已自动填入');
            return true;
        }
        return false;
    }

    async function fillDouyin(payload) {
        // 抖音创作者 - 视频描述/图文
        const editor = await waitFor('[contenteditable="true"], textarea[placeholder*="描述"], textarea[placeholder*="标题"]');
        if (editor) {
            if (editor.tagName === 'TEXTAREA' || editor.tagName === 'INPUT') {
                setInputValue(editor, payload.content);
            } else {
                fillContenteditable(editor, payload.content);
            }
            showNotice('✅ 抖音内容已自动填入');
            return true;
        }
        return false;
    }

    async function fillWechat(payload) {
        // 微信公众号图文编辑器（较复杂，可能受限）
        const editor = await waitFor('#ueditor_0, [contenteditable="true"].view, .edui-body-container');
        if (editor) {
            fillContenteditable(editor, payload.content);
            showNotice('✅ 公众号内容已自动填入');
            return true;
        }
        return false;
    }

    async function fillJike(payload) {
        const editor = await waitFor('[contenteditable="true"], textarea');
        if (editor) {
            if (editor.tagName === 'TEXTAREA') setInputValue(editor, payload.content);
            else fillContenteditable(editor, payload.content);
            showNotice('✅ 即刻内容已自动填入');
            return true;
        }
        return false;
    }

    // ===== Toast 通知 =====
    function showNotice(msg) {
        const div = document.createElement('div');
        div.textContent = msg;
        div.style.cssText = `
            position:fixed; top:20px; left:50%; transform:translateX(-50%);
            background:linear-gradient(135deg,#667eea,#764ba2); color:#fff;
            padding:12px 28px; border-radius:12px; font-size:15px; font-weight:500;
            z-index:99999; box-shadow:0 4px 20px rgba(0,0,0,0.15);
            animation:smSlideIn 0.3s ease;
        `;
        document.body.appendChild(div);
        setTimeout(() => {
            div.style.opacity = '0';
            div.style.transition = 'opacity 0.3s';
            setTimeout(() => div.remove(), 300);
        }, 3000);
    }

    // ===== 主流程 =====
    const payload = getPayload();
    if (!payload) return;

    const platform = detectPlatform();
    if (!platform) {
        console.log('[智能营销] 未识别的平台');
        return;
    }

    // 延迟执行，等待页面编辑器完全加载
    setTimeout(async () => {
        const fillers = {
            weibo: fillWeibo,
            xiaohongshu: fillXiaohongshu,
            zhihu: fillZhihu,
            bilibili: fillBilibili,
            toutiao: fillToutiao,
            douyin: fillDouyin,
            wechat: fillWechat,
            jike: fillJike,
        };
        const filler = fillers[platform];
        if (!filler) return;

        const success = await filler(payload);
        if (!success) {
            showNotice('⚠️ 未找到编辑框，请手动粘贴（内容已复制到剪贴板）');
            // 降级：复制到剪贴板
            navigator.clipboard.writeText(payload.content).catch(() => {});
        }
    }, 2000);

})();
