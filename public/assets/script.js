// 调试信息显示
        let debugTimer;
        function showDebugInfo(message) {
            const debugEl = document.getElementById('debugInfo');
            debugEl.textContent = message;
            clearTimeout(debugTimer);
            debugTimer = setTimeout(() => debugEl.textContent = '', 5000);
        }
        
        // 实时时钟
        function updateTime() {
            const now = new Date();
            document.getElementById('currentTime').textContent = 
        `${now.getHours().toString().padStart(2, '0')}:` +
        `${now.getMinutes().toString().padStart(2, '0')}:` +
        `${now.getSeconds().toString().padStart(2, '0')}`;
        }
        setInterval(updateTime, 1000);
        updateTime();
        
        // 获取天气
        async function getWeather() {
            try {
        const response = await fetch('https://api.kxzjoker.cn/api/Weather');
        const data = await response.json();
        
        if (data.code !== 200) throw new Error('天气获取失败');
        
        document.getElementById('weatherWidget').innerHTML = `
            <i class="fas fa-cloud-sun weather-icon-gradient"></i>
            ${data.data.tianqi.temperature}°C
        `;
        
        showDebugInfo(`👏欢迎来自${data.data.ipdata.info.split('-')[0]}的用户`);
        
            } catch (error) {
        document.getElementById('weatherWidget').innerHTML = `
            <i class="fas fa-cloud-sun weather-icon-gradient"></i>
            未知天气
        `;
        showDebugInfo('欢迎访问本服务');
            }
        }
        getWeather();
        
        // URL提取
        function extractURL(text) {
            try {
        const urlRegex = /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))/g;
        const matches = text.match(urlRegex);
        return matches ? matches[0] : null;
            } catch (e) {
        console.error('URL提取错误:', e);
        return null;
            }
        }
        
        // 解析内容
        let isParsing = false;
        async function parseContent() {
            if (isParsing) return;
            isParsing = true;

            // Use ID selector now
            const parseBtn = document.getElementById('parseBtn'); 
            if (parseBtn) {
                parseBtn.disabled = true;
                // Opacity is handled by CSS :disabled state now
            }
        
            showDebugInfo('开始解析流程...');
        
            try {
        const input = document.getElementById('urlInput');
        if (!input) throw new Error('找不到输入框元素');
        
        const url = extractURL(input.value);
        showDebugInfo(`提取到URL: ${url || '无'}`);
        
        if (!url) {
            showAlert('🚨 请输入有效的链接哦～ (´•̥ ̯ •̥`)');
            return;
        }
        
        toggleLoading(true);
        
        showDebugInfo(`正在解析中: ${url}`);
        const apiUrl = `https://yunzhiapi.cn/API/jhspjx.php?token=XtKhoUvi8XlY&url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl);
        showDebugInfo(`收到响应状态: ${response.status}`);

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        showDebugInfo(`API响应数据: ${JSON.stringify(data).slice(0, 100)}...`);

        if (!data || data.success !== true) {
            console.error('API 返回了错误:', data);
            throw new Error(data.message || '解析失败或无效的视频链接');
        }

        renderContent(data.data);
        showDebugInfo('内容渲染完成');
            } catch (error) {
        console.error('解析流程错误:', error);
        showDebugInfo(`错误: ${error.message}`);
        showAlert(`❌ 发生错误: ${error.message}`);
            } finally {
        toggleLoading(false);
        // Re-enable button
        const parseBtn = document.getElementById('parseBtn');
        if (parseBtn) {
            parseBtn.disabled = false;
            // Opacity is handled by CSS :disabled state now
        }
        isParsing = false;
            }
        }
        
        // 渲染内容
        function renderContent(data) {
            const contentBox = document.getElementById('contentBox');
            if (!contentBox) {
        throw new Error('找不到内容容器');
            }
        
            contentBox.innerHTML = '';
            
            try {
        if (data.images) {
            // Use new class structure from style.css
            const galleryHTML = data.images.map((img, index) => `
                <div class="gallery-item">
                    <img src="${img}" 
                         alt="图集 ${index + 1}"
                         loading="lazy"
                         onclick="showFullImage('${img}')"> 
                    <div class="image-index">${index + 1}</div>
                    <button class="download-single-btn" data-url="${img}" data-index="${index + 1}" title="下载此图">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            `).join('');
        
            // Apply new classes and remove inline styles
            contentBox.innerHTML = `
                <div class="media-card">
                    <h2>
                        <i class="fas fa-images"></i>
                        ${data.title || '未命名图集'}
                    </h2>
                    <div class="download-button-container">
                        <button class="download-all-btn">
                            <i class="fas fa-file-archive"></i>
                            打包保存
                        </button>
                    </div>
                    <div class="gallery-grid">
                        ${galleryHTML}
                    </div>
                </div>
            `;
        
            // 添加打包下载功能
            const downloadBtn = contentBox.querySelector('.download-all-btn');
            downloadBtn.addEventListener('click', async () => {
                try {
                    // Update button text and state
                    downloadBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 准备中...`;
                    downloadBtn.disabled = true;
                    
                    const zip = new JSZip();
                    const imgFolder = zip.folder("images");
                    
                    const downloadPromises = data.images.map(async (imgUrl, index) => {
                        try {
                            const response = await fetch(imgUrl);
                            if (!response.ok) throw new Error(`图片${index+1}下载失败`);
                            const blob = await response.blob();
                            imgFolder.file(`image_${index+1}.${getFileExtension(imgUrl)}`, blob);
                        } catch (error) {
                            console.warn(`图片${index+1}下载失败:`, error);
                            return null;
                        }
                    });
        
                    let completed = 0;
                    downloadPromises.forEach(promise => {
                        promise.finally(() => {
                            completed++;
                            const progress = Math.round((completed / data.images.length) * 100);
                            // Update progress text
                            downloadBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 打包中 ${progress}%`;
                        });
                    });
        
                    await Promise.all(downloadPromises);
                    
                    const zipBlob = await zip.generateAsync({
                        type: "blob",
                        compression: "DEFLATE",
                        compressionOptions: { level: 6 }
                    });
                    
                    const cleanTitle = data.title 
                        ? data.title.replace(/[<>:"/\\|?*]/g, '') 
                        : '未命名图集';
                    saveAs(zipBlob, `${cleanTitle}.zip`);
                    
                } catch (error) {
                    console.error('打包下载失败:', error);
                    showAlert('❌ 打包下载失败，请重试');
                } finally {
                    // Reset button text and state
                    downloadBtn.innerHTML = `<i class="fas fa-file-archive"></i> 打包保存`;
                    downloadBtn.disabled = false;
                }
            });
        
            // 添加单个图片下载功能
            const singleDownloadBtns = contentBox.querySelectorAll('.download-single-btn');
            singleDownloadBtns.forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation(); // 防止触发 showFullImage
                    const imgUrl = btn.dataset.url;
                    const index = btn.dataset.index;
                    const icon = btn.querySelector('i');

                    // Prevent multiple clicks while downloading
                    if (btn.classList.contains('downloading')) return;

                    btn.classList.add('downloading');
                    btn.disabled = true;
                    // Icon change is handled by CSS .downloading class now

                    try {
                        const response = await fetch(imgUrl);
                        if (!response.ok) throw new Error(`图片 ${index} 下载失败`);
                        const blob = await response.blob();
                        const cleanTitle = data.title ? data.title.replace(/[<>:"/\\|?*]/g, '') : '未命名图集';
                        const fileName = `${cleanTitle}_${index}.${getFileExtension(imgUrl)}`;
                        saveAs(blob, fileName);
                    } catch (error) {
                        console.error(`图片 ${index} 下载失败:`, error);
                        showAlert(`❌ 图片 ${index} 下载失败，请重试`);
                    } finally {
                        btn.classList.remove('downloading');
                        btn.disabled = false;
                        // Icon reverts automatically when class is removed
                    }
                });
            });

        } else if (data.video_url) {
            // Apply new classes and structure for video
            contentBox.innerHTML = `
                <div class="media-card">
                    <h2>
                        <i class="fas fa-video"></i>
                        ${data.video_title || '未命名视频'}
                    </h2>
                    <div class="video-wrapper">
                        <video controls>
                            <source src="${data.video_url}" type="video/mp4">
                            您的浏览器不支持视频播放
                        </video>
                    </div>
                    <div class="download-button-container">
                        <button class="download-btn">
                            <i class="fas fa-download"></i>
                            保存视频
                        </button>
                    </div>
                </div>
            `;
        
            // 视频下载功能
            // Video download functionality
            const downloadBtn = contentBox.querySelector('.download-btn');
            downloadBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                try {
                    // Update button text and state
                    downloadBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 下载中...`;
                    downloadBtn.disabled = true;
        
                    const response = await fetch(data.download_url);
                    if (!response.ok) throw new Error(`HTTP 错误！状态码: ${response.status}`);
                    
                    const blob = await response.blob();
                    const fileName = `${data.video_title || '未命名视频'}.mp4`;
                    saveAs(blob, fileName);
                } catch (error) {
                    console.error('下载失败:', error);
                    showAlert('❌ 视频下载失败，请重试');
                } finally {
                    downloadBtn.innerHTML = `<i class="fas fa-download"></i> 保存视频`;
                    downloadBtn.disabled = false;
                }
            });
        }
        contentBox.style.opacity = 1;
            } catch (e) {
        console.error('渲染错误:', e);
        showAlert('内容渲染失败，请检查数据格式');
            }
        }
        
        // 显示完整图片 (使用新的 CSS 类)
        function showFullImage(url) {
            const overlay = document.createElement('div');
            overlay.className = 'image-overlay'; // Use class from style.css
            
            const img = document.createElement('img');
            img.src = url;
            // Styles are now handled by .image-overlay img in CSS
            
            overlay.onclick = () => {
                overlay.style.animation = 'fadeOut 0.3s ease forwards';
                img.style.animation = 'scaleOut 0.3s ease forwards';
                setTimeout(() => overlay.remove(), 300); // Remove after animation
            };
            overlay.appendChild(img);
            document.body.appendChild(overlay);
        }

        // Add fadeOut and scaleOut animations to CSS if not already present
        /* 
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }

        @keyframes scaleOut {
            from { transform: scale(1); opacity: 1; }
            to { transform: scale(0.8); opacity: 0; }
        }
        */
        
        // 工具函数
        function toggleLoading(show) {
            document.getElementById('loading').style.display = show ? 'block' : 'none';
        }
        
        // 显示提示信息 (使用新的 CSS 类)
        function showAlert(message) {
            const alert = document.createElement('div');
            alert.className = 'alert-popup'; // Use class from style.css
            alert.innerHTML = message;
            
            document.body.appendChild(alert);
            
            // Animate out and remove
            setTimeout(() => {
                alert.style.animation = 'slideDown 0.3s ease forwards';
                setTimeout(() => alert.remove(), 300);
            }, 3000);
        }

        // Add slideDown animation to CSS if not already present
        /*
        @keyframes slideDown {
            from { transform: translate(-50%, 0); opacity: 1; }
            to { transform: translate(-50%, 50px); opacity: 0; }
        }
        */
        
        function getFileExtension(url) {
            try {
        const ext = url.split('.').pop().split(/[#?]/)[0].toLowerCase();
        const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        return validExtensions.includes(ext) ? ext : 'jpg';
            } catch (e) {
        return 'jpg';
            }
        }
        
        // 事件绑定 (确保按钮选择器正确)
        const parseButton = document.getElementById('parseBtn');
        if (parseButton) {
            parseButton.addEventListener('click', parseContent);
        }
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') parseContent();
            });
        }
        
        // 用户协议弹窗逻辑
        document.addEventListener('DOMContentLoaded', () => {
            const agreementModal = document.getElementById('agreementModal');
            const agreeBtn = document.getElementById('agreeBtn');
            const disagreeBtn = document.getElementById('disagreeBtn');
        
            // 检查本地存储中是否已同意协议
            const isAgreed = localStorage.getItem('agreementAccepted');
        
            if (!isAgreed && agreementModal) {
                agreementModal.style.display = 'flex'; // 显示弹窗
                // 强制重新计算样式以触发动画
                void agreementModal.offsetWidth;
                agreementModal.style.opacity = '1';
            }
        
            if (agreeBtn) {
                agreeBtn.addEventListener('click', () => {
                    localStorage.setItem('agreementAccepted', 'true');
                    if (agreementModal) {
                        agreementModal.style.animation = 'fadeOut 0.3s ease forwards';
                        const modalContent = agreementModal.querySelector('.modal-content');
                        if (modalContent) {
                            modalContent.style.animation = 'scaleOut 0.3s ease forwards';
                        }
                        setTimeout(() => {
                            agreementModal.style.display = 'none';
                            // 重置动画以便下次显示
                            agreementModal.style.animation = '';
                            if (modalContent) modalContent.style.animation = '';
                        }, 300);
                    }
                });
            }
        
            if (disagreeBtn) {
                disagreeBtn.addEventListener('click', () => {
                    // 跳转回首页，假设首页是 index.html
                    // 如果项目部署在子目录，可能需要调整路径
                    window.location.href = '/index.html'; 
                });
            }
        });
        
        // 初始化检查
        if (!window.saveAs) {
            console.warn('FileSaver.js 未加载！下载功能将不可用');
            showDebugInfo('警告：文件保存功能需要 FileSaver.js 支持');
        }
        if (!window.JSZip) {
            console.warn('JSZip 未加载！打包下载功能不可用');
            showDebugInfo('警告：打包下载需要 JSZip 库支持');
        }