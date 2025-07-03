document.addEventListener('DOMContentLoaded', () => {
    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }

    // --- DOM Elements ---
    const appContent = document.getElementById('app-content');
    const menuToggle = document.getElementById('menu-toggle');
    const sideMenu = document.getElementById('side-menu');
    const navLinks = document.querySelectorAll('.side-menu a');
    const backButtons = document.querySelectorAll('.back-button');

    // --- Page Management ---
    let currentPage = 'home';

    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId + '-page').classList.add('active');
        currentPage = pageId;
        sideMenu.classList.remove('active'); // Close menu on page change
    }

    // --- Event Listeners for Navigation ---
    menuToggle.addEventListener('click', () => {
        sideMenu.classList.toggle('active');
    });

    // Event listener for closing side menu using the "X" button
    const closeMenuButton = document.getElementById('close-menu');
    if (closeMenuButton) {
        closeMenuButton.addEventListener('click', () => {
            sideMenu.classList.remove('active');
        });
    }


    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.dataset.page;
            showPage(page);
        });
    });

    backButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const targetPage = e.currentTarget.dataset.target;
            showPage(targetPage);
            // Specific logic for product detail back button
            if (targetPage === 'product-list') {
                // This assumes product-list-category-title has text like "Produk Kategori: [CategoryName]"
                const categoryTitleElement = document.getElementById('product-list-category-title');
                if (categoryTitleElement) {
                    const categoryTitle = categoryTitleElement.textContent;
                    const category = categoryTitle.replace('Produk Kategori: ', '');
                    renderProductsByCategory(category);
                } else {
                    // Fallback if category title element is not found
                    renderProductCategories(); // Go back to main product categories
                    showPage('products');
                }
            }
        });
    });

    // --- Catatan & Pengingat Functionality ---
    const noteText = document.getElementById('note-text');
    const addNoteButton = document.getElementById('add-note-button');
    const pinnedNotesContainer = document.getElementById('pinned-notes-container');
    const otherNotesContainer = document.getElementById('other-notes-container');
    const emptyPinnedNotesMessage = document.getElementById('empty-pinned-notes-message');
    const emptyOtherNotesMessage = document.getElementById('empty-other-notes-message');

    let notes = loadNotes(); // Load notes on app start

    function saveNotes() {
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    function loadNotes() {
        const storedNotes = localStorage.getItem('notes');
        // Filter out any potentially invalid (e.g., null or undefined) notes
        // Ini membantu mencegah catatan 'undefined' muncul dari data lama yang rusak
        return storedNotes ? JSON.parse(storedNotes).filter(note => note && note.id && note.text !== undefined) : [];
    }

    const createNoteElement = (note) => {
        const noteDiv = document.createElement('div');
        noteDiv.classList.add('note-item');
        if (note.pinned) {
            noteDiv.classList.add('pinned');
        }

        noteDiv.innerHTML = `
            <p class="note-content">${note.text}</p>
            <div class="note-actions">
                <button class="pin-button" data-id="${note.id}" title="${note.pinned ? 'Lepas Sematan' : 'Sematkan Catatan'}">
                    <i class="fas fa-thumbtack ${note.pinned ? 'pinned' : ''}"></i>
                </button>
                <button class="delete-button" data-id="${note.id}" title="Hapus Catatan">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Event listener for delete button
        noteDiv.querySelector('.delete-button').addEventListener('click', (e) => {
            const idToDelete = e.currentTarget.dataset.id;
            notes = notes.filter(note => note.id !== idToDelete);
            saveNotes();
            renderNotes();
        });

        // Event listener for pin button
        noteDiv.querySelector('.pin-button').addEventListener('click', (e) => {
            const idToPin = e.currentTarget.dataset.id;
            const targetNote = notes.find(note => note.id === idToPin);
            if (targetNote) {
                targetNote.pinned = !targetNote.pinned; // Toggle status pinned
                saveNotes();
                renderNotes();
            }
        });

        return noteDiv;
    };

    function renderNotes() {
        pinnedNotesContainer.innerHTML = ''; // Clear current content
        otherNotesContainer.innerHTML = ''; // Clear current content

        const pinnedNotes = notes.filter(note => note.pinned);
        const otherNotes = notes.filter(note => !note.pinned);

        if (pinnedNotes.length === 0) {
            if (emptyPinnedNotesMessage) {
                emptyPinnedNotesMessage.style.display = 'block';
            }
        } else {
            if (emptyPinnedNotesMessage) {
                emptyPinnedNotesMessage.style.display = 'none';
            }
            pinnedNotes.forEach(note => {
                pinnedNotesContainer.appendChild(createNoteElement(note));
            });
        }

        if (otherNotes.length === 0) {
            if (emptyOtherNotesMessage) {
                emptyOtherNotesMessage.style.display = 'block';
            }
        } else {
            if (emptyOtherNotesMessage) {
                emptyOtherNotesMessage.style.display = 'none';
            }
            otherNotes.forEach(note => {
                otherNotesContainer.appendChild(createNoteElement(note));
            });
        }
    }

    addNoteButton.addEventListener('click', () => {
        const text = noteText.value.trim();
        if (text) {
            const newNote = {
                id: Date.now().toString(),
                text: text,
                pinned: false
            };
            // Menggunakan unshift() agar catatan terbaru muncul di atas
            notes.unshift(newNote); // BARIS INI MEMASTIKAN CATATAN BARU DI ATAS
            saveNotes();
            renderNotes();
            noteText.value = ''; // Clear input field
        }
    });

    // Initialize notes display on page load
    renderNotes();


    // --- Keuangan Berkelanjutan Functionality ---
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const currentBalanceEl = document.getElementById('current-balance');
    const transactionDescriptionInput = document.getElementById('transaction-description');
    const transactionAmountInput = document.getElementById('transaction-amount');
    const transactionTypeSelect = document.getElementById('transaction-type');
    const addTransactionButton = document.getElementById('add-transaction-button');
    const transactionList = document.getElementById('transaction-list');

    let transactions = loadTransactions(); // Load transactions on app start

    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    function loadTransactions() {
        const storedTransactions = localStorage.getItem('transactions');
        return storedTransactions ? JSON.parse(storedTransactions) : [];
    }

    function calculateSummary() {
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else {
                totalExpense += t.amount;
            }
        });

        const currentBalance = totalIncome - totalExpense;

        totalIncomeEl.textContent = formatCurrency(totalIncome);
        totalExpenseEl.textContent = formatCurrency(totalExpense);
        currentBalanceEl.textContent = formatCurrency(currentBalance);

        // Change balance color based on value
        if (currentBalance < 0) {
            currentBalanceEl.style.color = '#F44336'; // Red
        } else {
            currentBalanceEl.style.color = '#21D4FD'; // Blue
        }
    }

    function formatCurrency(amount) {
        return `Rp ${amount.toLocaleString('id-ID')}`;
    }

    function renderTransactions() {
        transactionList.innerHTML = ''; // Clear current content

        if (transactions.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.classList.add('empty-message');
            emptyMessage.textContent = 'Belum ada transaksi.';
            transactionList.appendChild(emptyMessage);
        } else {
            transactions.forEach(t => {
                const li = document.createElement('li');
                li.classList.add('transaction-item', t.type);
                li.innerHTML = `
                    <div class="transaction-details">
                        <h4>${t.description}</h4>
                        <p>${new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span class="transaction-amount-display">${t.type === 'expense' ? '-' : ''}${formatCurrency(t.amount)}</span>
                    <button class="delete-button" data-id="${t.id}" title="Hapus Transaksi">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                transactionList.appendChild(li);

                li.querySelector('.delete-button').addEventListener('click', (e) => {
                    const idToDelete = e.currentTarget.dataset.id;
                    transactions = transactions.filter(transaction => transaction.id !== idToDelete);
                    saveTransactions();
                    calculateSummary();
                    renderTransactions();
                });
            });
        }
    }

    addTransactionButton.addEventListener('click', () => {
        const description = transactionDescriptionInput.value.trim();
        const amount = parseFloat(transactionAmountInput.value);
        const type = transactionTypeSelect.value;

        if (description && !isNaN(amount) && amount > 0) {
            const newTransaction = {
                id: Date.now().toString(),
                description: description,
                amount: amount,
                type: type,
                date: new Date().toISOString()
            };
            transactions.push(newTransaction);
            saveTransactions();
            calculateSummary();
            renderTransactions();

            // Clear input fields
            transactionDescriptionInput.value = '';
            transactionAmountInput.value = '';
            transactionTypeSelect.value = 'income';
        } else {
            alert('Harap isi deskripsi dan jumlah yang valid.');
        }
    });

    // Initialize financial display on page load
    calculateSummary();
    renderTransactions();


    // --- Saran Produk Go Green Functionality ---
    const productCategoriesGrid = document.getElementById('product-categories-grid');
    const productListContainer = document.getElementById('product-list-container');
    const productListCategoryTitle = document.getElementById('product-list-category-title');
    const productDetailContent = document.getElementById('product-detail-content');
    const homeCategoryCards = document.querySelectorAll('#home-page .category-card');

    // Data Produk (Mengembalikan ke data yang Anda berikan)
    const greenProductsData = [
        {
            id: 'pdg001',
            category: 'Peralatan Dapur Go Green',
            name: 'Pembersih Dapur',
            description: 'Pembersih dapur dari bahan-bahan alami. Pembersih ini tidak mengandung bahan kimia berbahaya, sehingga aman untuk lingkungan dan kesehatan keluarga Anda.',
            sertifikasi: ['Eco-friendly', 'Biodegradable'],
            bahan_baku: ['Ekstrak jeruk', 'Cuka', 'Baking soda'],
            proses_produksi: 'Menggunakan bahan-bahan alami dan proses produksi yang ramah lingkungan.',
            dampak_lingkungan: 'Mengurangi polusi air dan tanah, aman bagi ekosistem.',
            diy_tips: 'Untuk noda membandel, biarkan cairan bekerja selama 5-10 menit sebelum disikat.',
            link_pembelian: 'https://www.tokopedia.com/contoh/pembersih-dapur-alami'
        },
        {
            id: 'pdg002',
            category: 'Peralatan Dapur Go Green',
            name: 'Spons Cuci Piring',
            description: 'Spons cuci piring dari bahan nabati alami. Spons ini mudah terurai dan tidak meninggalkan jejak mikroplastik.',
            sertifikasi: ['Vegan', 'Compostable'],
            bahan_baku: ['Serat loofah', 'Serat kelapa'],
            proses_produksi: 'Dibuat secara manual tanpa bahan sintetis.',
            dampak_lingkungan: 'Mengurangi limbah plastik, dapat dikomposkan setelah digunakan.',
            diy_tips: 'Rendam spons dalam air hangat dan sedikit cuka untuk membersihkan dan menghilangkan bau.',
            link_pembelian: 'https://www.shopee.co.id/contoh/spons-loofah-organik'
        },
        {
            id: 'pdp001',
            category: 'Peralatan Diri & Perawatan',
            name: 'Sabun Mandi Batang',
            description: 'Sabun mandi organik tanpa kemasan plastik. Dibuat dengan minyak esensial dan bahan alami yang melembapkan kulit.',
            sertifikasi: ['Cruelty-free', 'Zero Waste'],
            bahan_baku: ['Minyak kelapa', 'Shea butter', 'Minyak zaitun'],
            proses_produksi: 'Pembuatan secara cold process untuk menjaga kualitas bahan alami.',
            dampak_lingkungan: 'Mengurangi sampah plastik, bahan biodegradable.',
            diy_tips: 'Gunakan wadah sabun berongga agar sabun cepat kering dan tahan lama.',
            link_pembelian: 'https://www.tokopedia.com/contoh/sabun-batang-alami'
        },
        {
            id: 'pdp002',
            category: 'Peralatan Diri & Perawatan',
            name: 'Sikat Gigi Bambu',
            description: 'Sikat gigi dengan gagang bambu yang dapat terurai. Bulu sikatnya lembut dan aman untuk gusi.',
            sertifikasi: ['BPA-free', 'Sustainable sourced'],
            bahan_baku: ['Bambu Moso', 'Nylon-4 bristles'],
            proses_produksi: 'Dibuat dari bambu yang tumbuh cepat dan berkelanjutan.',
            dampak_lingkungan: 'Alternatif ramah lingkungan untuk sikat gigi plastik.',
            diy_tips: 'Setelah bulu sikat habis, gagang bambu bisa dijadikan pasak tanaman atau bahan kerajinan.',
            link_pembelian: 'https://www.shopee.co.id/contoh/sikat-gigi-bambu-eco'
        },
        {
            id: 'prum001',
            category: 'Produk Rumah Tangga',
            name: 'Tas Belanja Lipat',
            description: 'Tas belanja kain yang ringan, kuat, dan mudah dilipat. Pengganti sempurna untuk kantong plastik sekali pakai.',
            sertifikasi: ['Reusable', 'Durable'],
            bahan_baku: ['Kain daur ulang (RPET)'],
            proses_produksi: 'Dibuat dengan bahan daur ulang yang mengurangi limbah.',
            dampak_lingkungan: 'Mengurangi konsumsi kantong plastik, mendukung ekonomi sirkular.',
            diy_tips: 'Simpan beberapa di dalam tas atau mobil agar selalu siap saat berbelanja.',
            link_pembelian: 'https://www.tokopedia.com/contoh/tas-belanja-reusable'
        },
        {
            id: 'prum002',
            category: 'Produk Rumah Tangga',
            name: 'Beeswax Wrap',
            description: 'Pembungkus makanan alami dari kain katun berlapis lilin lebah. Alternatif ramah lingkungan untuk cling wrap plastik.',
            sertifikasi: ['Food-grade', 'Biodegradable'],
            bahan_baku: ['Kain katun organik', 'Lilin lebah', 'Minyak jojoba', 'Resin pohon'],
            proses_produksi: 'Buatan tangan dengan bahan alami.',
            dampak_lingkungan: 'Mengurangi limbah plastik, dapat digunakan kembali berkali-kali.',
            diy_tips: 'Cuci dengan air dingin dan sabun ringan, hindari panas tinggi.',
            link_pembelian: 'https://www.shopee.co.id/contoh/beeswax-wrap-alami'
        },
        {
            id: 'prum003',
            category: 'Produk Rumah Tangga',
            name: 'Sumbat Saluran Air',
            description: 'Sumbat saluran air yang ramah lingkungan dari bahan silikon daur ulang. Mencegah pemborosan air.',
            sertifikasi: ['Recycled content', 'BPA-free'],
            bahan_baku: ['Silikon daur ulang'],
            proses_produksi: 'Dibuat dari limbah silikon industri.',
            dampak_lingkungan: 'Mengurangi limbah, menghemat air dengan mencegah kebocoran.',
            diy_tips: 'Bersihkan secara berkala untuk menjaga kebersihan dan fungsi optimal.',
            link_pembelian: 'https://www.tokopedia.com/contoh/sumbat-saluran-silikon'
        },
        {
            id: 'pbl001',
            category: 'Produk Berkelanjutan Lainnya',
            name: 'Komposter Mini',
            description: 'Komposter ringkas untuk mengelola sampah organik rumah tangga. Mengubah sisa makanan menjadi pupuk.',
            sertifikasi: ['Zero Waste', 'Home Composting'],
            bahan_baku: ['Plastik daur ulang (HDPE)'],
            proses_produksi: 'Dibuat dengan bahan daur ulang yang kuat dan tahan lama.',
            dampak_lingkungan: 'Mengurangi sampah ke TPA, menghasilkan pupuk alami.',
            diy_tips: 'Tambahkan campuran sisa makanan dan daun kering untuk kompos yang seimbang.',
            link_pembelian: 'https://www.shopee.co.id/contoh/komposter-rumah-tangga'
        },
        {
            id: 'pbl002',
            category: 'Produk Berkelanjutan Lainnya',
            name: 'Botol Minum Kaca',
            description: 'Botol minum reusable dari kaca borosilikat yang tahan panas dan dingin. Alternatif aman dan sehat untuk botol plastik.',
            sertifikasi: ['BPA-free', 'Lead-free'],
            bahan_baku: ['Kaca borosilikat', 'Silikon food-grade'],
            proses_produksi: 'Dibuat dengan standar keamanan makanan yang ketat.',
            dampak_lingkungan: 'Mengurangi penggunaan botol plastik sekali pakai.',
            diy_tips: 'Cuci dengan sikat botol dan jemur terbalik agar kering sempurna.',
            link_pembelian: 'https://www.tokopedia.com/contoh/botol-minum-kaca-eco'
        }
    ];

    const productCategories = [
        { name: 'Peralatan Dapur Go Green', icon: 'fas fa-utensils' },
        { name: 'Peralatan Diri & Perawatan', icon: 'fas fa-spa' },
        { name: 'Produk Rumah Tangga', icon: 'fas fa-home' },
        { name: 'Produk Berkelanjutan Lainnya', icon: 'fas fa-leaf' }
    ];

    function renderProductCategories() {
        productCategoriesGrid.innerHTML = ''; // Clear previous content
        productCategories.forEach(category => {
            const card = document.createElement('div');
            card.classList.add('category-card');
            card.dataset.category = category.name;
            card.innerHTML = `
                <i class="${category.icon}"></i>
                <h3>${category.name}</h3>
            `;
            productCategoriesGrid.appendChild(card);

            card.addEventListener('click', () => {
                renderProductsByCategory(category.name);
                showPage('product-list');
            });
        });
    }

    function renderProductsByCategory(categoryName) {
        productListContainer.innerHTML = ''; // Clear previous content
        productListCategoryTitle.textContent = `Produk Kategori: ${categoryName}`;

        const filteredProducts = greenProductsData.filter(p => p.category === categoryName);

        if (filteredProducts.length === 0) {
            productListContainer.innerHTML = '<p style="text-align: center; color: #C0C0C0;">Belum ada produk di kategori ini.</p>';
        } else {
            filteredProducts.forEach(product => {
                const productItem = document.createElement('div');
                productItem.classList.add('product-item');
                productItem.dataset.id = product.id;
                productItem.innerHTML = `
                    <h3>${product.name}</h3>
                    <p>${product.description.substring(0, 80)}...</p>
                `;
                productListContainer.appendChild(productItem);

                productItem.addEventListener('click', () => {
                    showProductDetail(product.id);
                    showPage('product-detail');
                });
            });
        }
    }

    function showProductDetail(productId) {
        const product = greenProductsData.find(p => p.id === productId);
        if (!product) {
            productDetailContent.innerHTML = '<p style="text-align: center; color: #F44336;">Produk tidak ditemukan.</p>';
            return;
        }

        productDetailContent.innerHTML = `
            <h2>${product.name}</h2>
            <p>${product.description}</p>

            <h3>Sertifikasi</h3>
            <ul>
                ${product.sertifikasi.map(s => `<li>${s}</li>`).join('')}
            </ul>

            <h3>Bahan Baku Utama</h3>
            <ul>
                ${product.bahan_baku.map(b => `<li>${b}</li>`).join('')}
            </ul>

            <h3>Proses Produksi</h3>
            <p>${product.proses_produksi}</p>

            <h3>Dampak Lingkungan</h3>
            <p>${product.dampak_lingkungan}</p>

            <h3>Tips DIY & Penggunaan Berkelanjutan</h3>
            <p>${product.diy_tips}</p>

            <h3>Link Pembelian</h3>
            <p><a href="${product.link_pembelian}" target="_blank" class="product-detail-link">Beli di Sini</a></p>
        `;
    }

    // Event listener for Home page category cards
    homeCategoryCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const category = e.currentTarget.dataset.category;
            renderProductsByCategory(category);
            showPage('product-list');
        });
    });

    // Initialize product categories on page load for the 'produk' page
    renderProductCategories();

    // --- Initial Page Load ---
    showPage('home'); // Show home page by default
});
