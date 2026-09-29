document.addEventListener('DOMContentLoaded', () => {
  const btnScan = document.getElementById('btn-nfc-scan');
  if (!btnScan) return;

  btnScan.addEventListener('click', async () => {
    if (!('NDEFReader' in window)) {
      alert('Browser Anda tidak mendukung NFC (Gunakan Chrome Android).');
      return;
    }

    try {
      const ndef = new NDEFReader();
      await ndef.scan();
      btnScan.innerText = 'Menunggu Kartu...';
      btnScan.classList.add('bg-blue-100', 'text-blue-700', 'animate-pulse');

      ndef.addEventListener("reading", ({ serialNumber }) => {
        // Reset button state
        btnScan.innerText = 'Tap e-Money';
        btnScan.classList.remove('bg-blue-100', 'text-blue-700', 'animate-pulse');
        
        handleNFCTap(serialNumber);
      });

      ndef.addEventListener("readingerror", () => {
         // Ignore reading errors for empty iso-dep cards
      });

    } catch (error) {
      alert('Error mengaktifkan NFC: ' + error.message);
      btnScan.innerText = 'Tap e-Money';
    }
  });

  function handleNFCTap(uid) {
    let profile = PulseStorage.getProfile() || { name: 'User' };
    
    // Pendaftaran Kartu Baru
    if (!profile.nfcUid || profile.nfcUid !== uid) {
      if (!profile.nfcUid) {
        const wantToRegister = confirm(`Kartu baru terdeteksi (UID: ${uid}). Ingin mendaftarkan kartu ini sebagai Shadow e-Money Anda?`);
        if (wantToRegister) {
          const initialBalance = prompt('Masukkan saldo saat ini di dalam kartu e-Money Anda (contoh: 50000):', '50000');
          if (initialBalance !== null && !isNaN(initialBalance)) {
            profile.nfcUid = uid;
            profile.nfcBalance = Number(initialBalance);
            PulseStorage.saveProfile(profile);
            alert('Kartu berhasil didaftarkan! Sisa saldo Shadow Wallet: ' + PulseUtils.formatCurrency(profile.nfcBalance));
          }
        }
      } else {
        alert('Kartu ini berbeda dengan yang terdaftar di akun Anda.');
      }
      return;
    }

    // Kartu Terdaftar - Input Pengeluaran Cepat
    const expenseStr = prompt(`Shadow e-Money Anda (Sisa: ${PulseUtils.formatCurrency(profile.nfcBalance)}).\nBerapa nominal pengeluaran baru Anda?`, '');
    if (expenseStr === null || expenseStr.trim() === '') return;
    const expenseAmt = Number(expenseStr);
    if (isNaN(expenseAmt) || expenseAmt <= 0) {
      alert('Nominal tidak valid.');
      return;
    }

    if (expenseAmt > profile.nfcBalance) {
      const proceed = confirm(`Saldo Shadow Anda kurang! Sisa: ${PulseUtils.formatCurrency(profile.nfcBalance)}. Tetap catat pengeluaran?`);
      if (!proceed) return;
    }

    const desc = prompt('Keterangan pengeluaran (opsional):', 'Tol / Transportasi') || 'e-Money';

    // Kurangi saldo shadow
    profile.nfcBalance -= expenseAmt;
    PulseStorage.saveProfile(profile);

    // Catat ke transaksi utama
    PulseStorage.addTransaction({
      type: 'expense',
      category: 'transport', // default ke transportasi karena e-money
      amount: expenseAmt,
      date: PulseUtils.todayISO(),
      description: '[NFC] ' + desc
    });

    alert(`Berhasil dicatat! Sisa saldo Shadow: ${PulseUtils.formatCurrency(profile.nfcBalance)}`);
    
    // Refresh halaman agar list transaksi update
    window.location.reload();
  }
});
