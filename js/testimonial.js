
document.addEventListener('DOMContentLoaded', () => {
  const quoteEl = document.getElementById('testimonialQuote');
  const nameEl = document.getElementById('testimonialName');
  const roleEl = document.getElementById('testimonialRole');
  const avatarEl = document.getElementById('testimonialAvatar');
  const prevBtn = document.getElementById('testimonialPrev');
  const nextBtn = document.getElementById('testimonialNext');

  if (!quoteEl) return;

  const testimonials = [
    {
      quote: '"Sekarang aku tahu ke mana uangku benar-benar pergi. Insight dari PulseFi bikin aku lebih sadar sebelum belanja."',
      name: 'Alya Putri',
      role: 'Mahasiswa',
      avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      quote: '"Coba-coba ubah kebiasaan lewat simulasi bikin aku berani ambil keputusan finansial yang lebih besar."',
      name: 'Rangga Saputra',
      role: 'Pegawai Swasta',
      avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      quote: '"PulseFi ngingetin pas aku mulai boros, bukan buat nge-judge, tapi bantu aku sadar sebelum kebiasaannya makin parah."',
      name: 'Dinda Ayu',
      role: 'Freelancer',
      avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
    {
      quote: '"Semua transaksi kebaca jelas dalam satu tampilan. Nggak ribet lagi ngecek mutasi rekening satu per satu."',
      name: 'Fajar Nugroho',
      role: 'Karyawan',
      avatarUrl: 'https://randomuser.me/api/portraits/men/76.jpg',
    },
  ];

  let current = 0;
  let rotateTimer = null;
  const AUTO_ROTATE_MS = 6000;
  const LETTER_STEP_MS = 14;

  const renderQuote = (text) => {
    quoteEl.classList.remove('is-settled');

    const words = text.split(' ');
    let letterIndex = 0;

    quoteEl.innerHTML = words
      .map((word) => {
        const letters = word
          .split('')
          .map((ch) => {
            const span = `<span class="letter" style="animation-delay:${letterIndex * LETTER_STEP_MS}ms">${ch}</span>`;
            letterIndex += 1;
            return span;
          })
          .join('');
        return `<span class="word">${letters}</span>`;
      })
      .join(' ');

    const totalRevealTime = letterIndex * LETTER_STEP_MS + 500;
    setTimeout(() => {
      quoteEl.classList.add('is-settled');
    }, totalRevealTime + 300);
  };

  const renderTestimonial = (index) => {
    const item = testimonials[index];
    renderQuote(item.quote);
    nameEl.textContent = item.name;
    roleEl.textContent = item.role;
    avatarEl.style.backgroundImage = `url(${item.avatarUrl})`;
  };
  const goTo = (index) => {
    current = (index + testimonials.length) % testimonials.length;
    renderTestimonial(current);
    resetAutoRotate();
  };

  const resetAutoRotate = () => {
    if (rotateTimer) clearInterval(rotateTimer);
    rotateTimer = setInterval(() => goTo(current + 1), AUTO_ROTATE_MS);
  };

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));

  renderTestimonial(current);
  resetAutoRotate();
});