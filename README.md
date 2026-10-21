# ECONOVA — Financial Literacy Platform

Platform edukasi literasi keuangan berbahasa Indonesia untuk siswa SMK dan masyarakat umum. ECONOVA menggunakan HTML, CSS, JavaScript vanilla, dan penyimpanan lokal browser—tanpa backend, framework, atau proses build.

## Fitur belajar

- Delapan bab materi fondasi yang telah tersedia, delapan bab Jalur Literasi Keuangan dengan 64 materi, dan kurikulum pengayaan kelas 10–12 dengan 33 bab/66 materi.
- Pencarian materi berdasarkan judul dan isi, filter jalur/kelas/bab/status, serta pengurutan.
- Peta perjalanan belajar, materi rekomendasi, profil yang dapat diperbarui, dan halaman progres.
- Layar penyelesaian materi dengan progres bab/jalur, XP dan pencapaian aktual, serta tautan langsung ke materi, bab, atau jenjang berikutnya. Penyelesaian baru tercatat setelah latihan materi dijawab benar; ringkasannya tetap dapat dibuka setelah halaman dimuat ulang.
- Pusat misi harian/mingguan dan pencapaian berdasarkan aktivitas lokal, dengan reward tiap periode yang dibatasi agar tidak berulang karena refresh.
- Kuis dengan 80 soal terstruktur (10 soal per bab), delapan simulasi interaktif (anggaran, inflasi, keputusan, target tabungan/dana cadangan, biaya pinjaman, portofolio virtual, deteksi penipuan, dan usaha virtual), review, serta pencapaian.
- Finance Calculator Lab untuk bunga sederhana/majemuk, inflasi, target tabungan, dan anggaran; Financial Decision Challenge; serta simulator kehidupan finansial dengan uang virtual.
- Personal Learning Intelligence merangkum materi selesai, hasil kuis per topik, dan rekomendasi dari aktivitas yang benar-benar tersimpan.
- XP: +20 saat pertama kali menyelesaikan materi setelah latihan benar, +5 untuk latihan materi/soal bank benar pertama kali, +10 untuk kombinasi filter kuis atau jenis simulasi pertama, +15 untuk tantangan anggaran, skenario keputusan lama yang berhasil, dan penggunaan pertama simulator kehidupan, serta +10 per challenge keputusan baru. Misi memberi XP harian/mingguan satu kali per periode; refresh atau membuka ulang tidak mengulang hadiah.
- Level dihitung dari total XP: Level 1 mulai 0 XP; batas berikutnya 100, 250, 450, 700, 1.000 XP, lalu bertambah 300 XP per level. Gelar level menyesuaikan perjalanan belajar.
- Pencapaian terbuka berdasarkan materi selesai, skor kuis, tantangan anggaran, dan hari belajar berbeda yang tercatat.
- Antarmuka memakai tema ECONOVA dark fintech dengan token warna cyan dan violet, komponen konsisten, navigasi responsif, fokus keyboard yang terlihat, serta dukungan reduced motion.
- Efek suara interaktif untuk jawaban kuis, progres, pencapaian, level, dan tindakan penting; kontrol aktif/nonaktif serta volume tersedia di menu Suara dan preferensinya tersimpan di browser. Efek dibuat lokal dengan Web Audio API setelah interaksi pengguna; materi tidak dibacakan otomatis.

## Menjalankan secara lokal

- Buka `index.html` langsung di browser, atau
- Jalankan Live Server dari VS Code pada folder proyek.

Semua asset memakai path relatif sehingga proyek dapat diterbitkan pada subpath GitHub Pages.

## Menerbitkan ke GitHub Pages

1. Buat repository GitHub baru dan unggah seluruh isi folder ECONOVA, dengan `index.html` di root repository.
2. Buka **Settings → Pages**.
3. Pada **Build and deployment**, pilih **Deploy from a branch**.
4. Pilih branch yang berisi website (umumnya `main`) dan folder **/(root)**, lalu pilih **Save**.
5. Tunggu workflow Pages selesai. URL website akan muncul pada bagian GitHub Pages di Settings.

## Batasan versi ini

- Profil siswa, progres, dan skor hanya tersimpan di browser yang sama jika `localStorage` tersedia. Data tidak terverifikasi, tidak dikirim ke server, dan tidak tersinkron antarperangkat.
- XP dan pencapaian adalah motivasi belajar lokal dan dapat dimanipulasi melalui perangkat; bukan sistem reward atau sertifikasi yang aman.
- Admin adalah pratinjau DEMO tanpa autentikasi. Dashboard tidak menyimpan atau menerbitkan perubahan konten.
- Admin adalah pratinjau statis berlabel DEMO; daftar konten tidak dapat disunting atau diterbitkan.
- Susunan materi kurikulum adalah pengayaan dan perlu diselaraskan oleh guru dengan kurikulum serta kalender sekolah yang berlaku.
- Semua simulasi adalah ilustrasi edukatif. Angka simulasi bukan prediksi, penawaran pinjaman, rekomendasi investasi, atau transaksi sungguhan.
- Isi materi dan kuis merupakan edukasi umum, bukan saran investasi atau jaminan hasil.
