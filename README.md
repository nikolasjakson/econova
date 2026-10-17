# ECONOVA — Financial Literacy Platform

Platform edukasi literasi keuangan berbahasa Indonesia untuk siswa SMK dan masyarakat umum. ECONOVA menggunakan HTML, CSS, JavaScript vanilla, dan penyimpanan lokal browser—tanpa backend, framework, atau proses build.

## Fitur belajar

- Delapan bab materi fondasi yang telah tersedia, delapan bab Jalur Literasi Keuangan dengan 64 materi, dan kurikulum pengayaan kelas 10–12 dengan 33 bab/66 materi.
- Pencarian materi berdasarkan judul dan isi, filter jalur/kelas/bab/status, serta pengurutan.
- Peta perjalanan belajar, materi rekomendasi, profil yang dapat diperbarui, dan halaman progres.
- Misi belajar dan pencapaian yang dihitung dari aktivitas lokal; reward XP tidak berbasis waktu menjawab.
- Kuis dengan 80 soal terstruktur (10 soal per bab), delapan simulasi interaktif (anggaran, inflasi, keputusan, target tabungan/dana cadangan, biaya pinjaman, portofolio virtual, deteksi penipuan, dan usaha virtual), review, serta pencapaian.
- XP: +20 saat pertama kali menyelesaikan materi, +5 saat pertama kali menjawab latihan materi dengan benar, +5 untuk setiap soal bank yang dijawab benar pertama kali, +10 untuk kombinasi filter kuis atau jenis simulasi yang diselesaikan pertama kali, dan +15 untuk tantangan anggaran/keputusan berhasil pertama kali. Reward tidak berdasarkan kecepatan dan aktivitas yang sama tidak memberi XP berulang.
- Level dihitung dari total XP: Level 1 mulai 0 XP; batas berikutnya 100, 250, 450, 700, 1.000 XP, lalu bertambah 300 XP per level. Gelar level menyesuaikan perjalanan belajar.
- Pencapaian terbuka berdasarkan materi selesai, skor kuis, tantangan anggaran, dan hari belajar berbeda yang tercatat.

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
