/* Jalur belajar ECONOVA. Susunan kurikulum sekolah adalah bahan pengayaan dan perlu diselaraskan guru. */
(function () {
  "use strict";
  const literacyRows = [
    ["literasi-uang", "Mengenal Uang dan Kebiasaan Finansial", [
      ["Literasi keuangan", "Literasi keuangan ialah pengetahuan dan kebiasaan untuk mengambil keputusan tentang uang secara sadar. Kemampuan ini mencakup memahami informasi, membuat rencana, dan menyesuaikan pilihan dengan keadaan.", "Siswa membandingkan biaya transportasi, makan, dan kebutuhan tugas sebelum membagi uang saku.", "Literasi bukan kemampuan menebak produk yang pasti untung; fokusnya adalah keputusan sesuai tujuan dan risiko."],
      ["Fungsi uang", "Uang membantu pertukaran, menjadi satuan untuk membandingkan nilai, dan dapat menyimpan daya beli untuk kemudian. Nilai riilnya dapat berubah ketika harga berubah.", "Harga roti Rp8.000 dan susu Rp12.000 dapat dibandingkan dalam satuan rupiah yang sama.", "Nominal yang tetap tidak berarti jumlah barang yang bisa dibeli selalu tetap."],
      ["Kebutuhan dan keinginan", "Kebutuhan mendukung hidup atau tanggung jawab, sedangkan keinginan memberi kenyamanan dan dapat ditunda. Kategori bergantung konteks dan kemampuan.", "Kuota untuk mengerjakan tugas bisa menjadi kebutuhan belajar; paket hiburan tambahan mungkin dapat menunggu.", "Keinginan bukan hal buruk. Yang penting memastikan kebutuhan penting dan kemampuan terpenuhi."],
      ["Kebiasaan belanja", "Kebiasaan belanja terbentuk dari pemicu, pilihan, dan pengulangan. Mencatat pengeluaran tanpa menghakimi membantu menemukan pola yang ingin diubah.", "Catat camilan dan ongkos selama satu pekan untuk melihat pos mana yang sering luput dari anggaran.", "Pengeluaran kecil tidak otomatis salah; lihat jumlah, tujuan, dan dampak totalnya."],
      ["Skala prioritas", "Skala prioritas mengurutkan pengeluaran berdasarkan kepentingan, tenggat, konsekuensi, dan kemampuan. Prioritas dapat berubah saat kondisi berubah.", "Sebelum membeli barang tren, sisihkan dahulu ongkos pulang dan uang makan hari itu.", "Prioritas bukan daftar yang sama untuk semua orang; kondisi keluarga dan tanggung jawab berbeda."],
      ["Biaya peluang", "Biaya peluang adalah nilai alternatif terbaik yang dilepas saat memilih. Nilainya tidak selalu berupa uang tunai.", "Memakai Sabtu untuk kerja tambahan dapat berarti mengurangi waktu istirahat atau belajar.", "Biaya peluang bukan semua alternatif yang dilepas dijumlahkan, melainkan alternatif terbaik berikutnya."],
      ["Tujuan keuangan", "Tujuan yang jelas menyebut apa yang ingin dicapai, jumlah atau ukuran, waktu, dan langkah yang realistis. Tujuan dapat ditinjau ulang.", "Target Rp300.000 dalam 10 minggu dapat diterjemahkan menjadi setoran rata-rata Rp30.000 per minggu.", "Target bukan kewajiban kaku; sesuaikan bila pemasukan atau kebutuhan berubah."],
      ["Kesalahan keuangan pemula", "Kesalahan seperti tidak mencatat biaya, percaya tekanan waktu, atau menyamakan pemasukan dengan uang bebas dapat diperbaiki melalui jeda dan pemeriksaan.", "Sebelum transfer, periksa nama penerima dan alasan pembayaran melalui sumber terpisah.", "Kesalahan adalah informasi untuk belajar, bukan label diri atau ukuran kecerdasan."]
    ]],
    ["literasi-anggaran", "Anggaran dan Uang Saku", [
      ["Pemasukan dan pengeluaran", "Pemasukan adalah uang yang diterima; pengeluaran adalah uang yang digunakan atau menjadi kewajiban. Selisihnya membantu menunjukkan ruang untuk tujuan lain.", "Uang saku Rp400.000 dikurangi ongkos, makan, dan tagihan yang direncanakan menunjukkan sisa yang dapat dibagi.", "Pemasukan bukan seluruhnya uang yang bebas dibelanjakan; kewajiban tetap perlu dihitung."],
      ["Anggaran mingguan", "Anggaran mingguan membagi sumber daya ke satu periode pendek sehingga mudah dibandingkan dengan kegiatan harian.", "Dari uang mingguan Rp150.000, tentukan ongkos, makan, dan batas camilan berdasarkan jadwal sekolah.", "Pembagian tidak harus mengikuti rasio baku; kebutuhan setiap siswa berbeda."],
      ["Anggaran bulanan", "Anggaran bulanan menampilkan pemasukan dan kewajiban yang berulang maupun tujuan yang memerlukan setoran bertahap.", "Catat uang saku bulanan, paket data, iuran, transportasi, dan target tabungan.", "Pengeluaran tidak selalu merata tiap minggu; sisihkan untuk tagihan yang jatuh tempo belakangan."],
      ["Pengeluaran tetap dan variabel", "Pengeluaran tetap cenderung berulang dengan jumlah relatif terencana; pengeluaran variabel berubah mengikuti pemakaian atau keadaan.", "Iuran bulanan sekolah dapat relatif tetap, sedangkan biaya makan berubah menurut hari.", "Tetap bukan berarti tidak dapat berubah selamanya; biaya variabel juga bisa diperkirakan."],
      ["Kategori pengeluaran", "Kategori seperti kebutuhan, keinginan, tabungan, dan kewajiban membantu melihat komposisi uang, tetapi kategori perlu cocok dengan tujuan pribadi.", "Pisahkan ongkos, makan, tugas, hiburan, tabungan, dan biaya tak terduga.", "Anggaran tidak menjadi lebih baik hanya karena memiliki banyak kategori; pilih yang membantu mengambil keputusan."],
      ["Menilai kebutuhan", "Nilai kebutuhan dengan melihat dampak jika ditunda, tenggat, alternatif, dan ketersediaan sumber daya.", "Jika sepatu sekolah rusak, perbaikan mungkin lebih sesuai anggaran daripada membeli model baru.", "Kebutuhan tidak selalu berarti pilihan termahal atau yang sedang tren."],
      ["Pengeluaran tak terduga", "Pengeluaran tak terduga dapat dikurangi dampaknya dengan menyisihkan dana sesuai kemampuan dan mengetahui pilihan bantuan yang tersedia.", "Simpan bertahap untuk biaya servis sepeda yang tidak muncul setiap bulan.", "Dana darurat tidak harus terkumpul sekaligus; mulai dari jumlah yang realistis."],
      ["Mengevaluasi anggaran", "Bandingkan rencana dengan catatan nyata, cari penyebab selisih, lalu ubah anggaran secara wajar.", "Jika ongkos naik karena rute sekolah berubah, perbarui pos transportasi dan tinjau pos fleksibel.", "Selisih bukan kegagalan pribadi; itu sinyal bahwa rencana perlu disesuaikan."]
    ]],
    ["literasi-tabungan", "Tabungan, Dana Darurat, dan Inflasi", [
      ["Tujuan menabung", "Tujuan tabungan membantu menentukan jumlah, waktu, dan tempat menyimpan dana. Dana kebutuhan dekat sebaiknya mudah dijangkau.", "Pisahkan tabungan buku praktik dari uang jajan mingguan agar kemajuannya terlihat.", "Menabung tidak menuntut satu persentase tetap untuk semua orang."],
      ["Target tabungan", "Setoran rata-rata dapat diperkirakan dengan membagi target dengan jumlah periode. Sesuaikan jadwal jika setoran terasa tidak realistis.", "Target Rp360.000 dalam 12 minggu memerlukan rata-rata Rp30.000 per minggu tanpa memperhitungkan bunga.", "Angka rata-rata tidak berarti setiap minggu harus identik."],
      ["Waktu mencapai target", "Perkiraan waktu adalah target dibagi setoran per periode. Rumus sederhana ini mengasumsikan setoran rutin dan tidak menghitung bunga atau biaya.", "Rp450.000 dengan setoran Rp25.000 per minggu memerlukan sekitar 18 minggu.", "Perkiraan bukan jaminan; pemasukan, pengeluaran, dan biaya dapat berubah."],
      ["Konsep dana darurat", "Dana darurat memberi bantalan untuk kebutuhan penting yang sulit diprediksi. Bangun bertahap dan jaga agar dapat diakses saat diperlukan.", "Tabungan terpisah dapat membantu saat perlu membeli obat atau memperbaiki kendaraan untuk sekolah.", "Dana darurat bukan investasi berimbal hasil tinggi dan tidak meniadakan semua risiko."],
      ["Inflasi dan daya beli", "Inflasi adalah perubahan tingkat harga umum; daya beli menunjukkan jumlah barang atau jasa yang dapat dibeli dengan nominal tertentu.", "Jika harga satu buku catatan naik dari Rp10.000 ke Rp11.000, Rp50.000 membeli lebih sedikit buku.", "Perubahan harga satu barang tidak sama dengan ukuran inflasi seluruh ekonomi."],
      ["Bunga sederhana", "Dalam contoh bunga sederhana, bunga dihitung dari pokok awal: bunga = pokok × tingkat per periode × jumlah periode, sesuai ketentuan produk.", "Pokok Rp1.000.000 dengan bunga sederhana ilustratif 3% setahun selama 2 tahun menghasilkan bunga kotor Rp60.000.", "Perhitungan contoh belum memperhitungkan pajak, biaya, perubahan suku bunga, atau syarat produk."],
      ["Bunga majemuk", "Bunga majemuk menghitung pertumbuhan atas pokok dan hasil yang telah ditambahkan sebelumnya, bila ketentuan memang mengakumulasikannya.", "Saldo Rp1.000.000 tumbuh 5% dua periode menjadi Rp1.102.500 sebelum biaya dan pajak.", "Bunga majemuk bukan jaminan daya beli tumbuh atau risiko menjadi nol."],
      ["Biaya dan hasil riil", "Biaya administrasi mengurangi saldo. Hasil riil membandingkan perubahan nominal dengan inflasi; pendekatan awalnya hasil nominal dikurangi inflasi.", "Hasil nominal 5% dan inflasi 3% memberi pendekatan hasil riil sekitar 2% sebelum biaya dan pajak.", "Bunga positif tidak selalu membuat daya beli meningkat jika kenaikan harga dan biaya lebih besar."]
    ]],
    ["literasi-risiko", "Risiko, Utang, dan Keputusan Keuangan", [
      ["Risiko dan ketidakpastian", "Risiko adalah kemungkinan hasil berbeda dari harapan. Keputusan yang baik mengidentifikasi dampak dan kemungkinan, bukan berpura-pura menghapus ketidakpastian.", "Sebelum membeli gawai, pertimbangkan biaya perbaikan, kehilangan, dan kebutuhan dana lain.", "Tidak semua risiko dapat diprediksi dengan angka pasti."],
      ["Pinjaman dan bunga", "Pinjaman memberi dana sekarang dan kewajiban membayar kembali berdasarkan perjanjian. Bunga adalah biaya penggunaan dana sesuai ketentuan.", "Bandingkan jumlah pinjaman dengan seluruh angsuran yang perlu dibayar.", "Cicilan kecil belum tentu berarti pinjaman murah."],
      ["Biaya pinjaman", "Biaya pinjaman dapat mencakup bunga, administrasi, denda, dan biaya lain yang tercantum dalam perjanjian.", "Hitung total bayar Rp100.000 per bulan selama 12 bulan ditambah biaya awal sebelum membandingkan penawaran.", "Jangan hanya melihat bunga promosi atau angsuran pertama."],
      ["Denda dan keterlambatan", "Keterlambatan dapat menambah biaya atau memengaruhi layanan sesuai kontrak. Hubungi penyedia lebih awal untuk memahami opsi jika pembayaran sulit.", "Pasang pengingat tagihan dan baca aturan tenggat serta denda.", "Mengabaikan pesan resmi bukan cara menghindari kewajiban."],
      ["Membaca syarat layanan", "Baca jumlah total, jadwal, biaya, data yang diminta, pembatalan, dan pihak yang bertanggung jawab sebelum menyetujui layanan.", "Sebelum berlangganan aplikasi, periksa masa uji coba dan tanggal perpanjangan otomatis.", "Tombol persetujuan bukan pengganti pemahaman atas syarat."],
      ["Keputusan impulsif", "Jeda sebelum membeli memberi waktu membandingkan kebutuhan, harga, anggaran, dan konsekuensi.", "Tunggu satu hari sebelum membeli barang nonmendesak yang membuat anggaran tertekan.", "Diskon tidak otomatis berarti hemat bila barang tidak dibutuhkan."],
      ["Membandingkan alternatif", "Bandingkan alternatif dengan kriteria yang sama: total biaya, kualitas, waktu, risiko, dan kecocokan tujuan.", "Bandingkan dua paket data berdasarkan kuota efektif dan biaya per bulan, bukan harga awal saja.", "Harga termurah belum tentu paling sesuai untuk kebutuhan."],
      ["Biaya peluang", "Biaya peluang menunjukkan manfaat alternatif terbaik yang tidak dipilih dan membantu menjelaskan konsekuensi pilihan.", "Memakai uang Rp100.000 untuk hiburan berarti uang itu tidak tersedia untuk buku yang diperlukan.", "Biaya peluang tidak selalu berarti pilihan yang dipilih salah."]
    ]],
    ["literasi-investasi", "Investasi dan Berbagai Aset", [
      ["Menabung dan investasi", "Tabungan biasanya menekankan penyimpanan dan akses dana; investasi menempatkan dana pada aset dengan potensi perubahan nilai dan risiko.", "Dana ongkos bulan depan berbeda tujuan dari dana yang direncanakan untuk tujuan jangka panjang.", "Investasi tidak selalu lebih baik daripada tabungan; fungsi dan tenggatnya berbeda."],
      ["Tujuan investasi", "Tujuan, jangka waktu, kebutuhan likuiditas, dan kemampuan menanggung perubahan nilai membantu menilai kecocokan aset.", "Dana yang dibutuhkan untuk daftar ulang bulan depan memiliki horizon berbeda dari tujuan beberapa tahun lagi.", "Tujuan jangka panjang pun tidak menghilangkan risiko kerugian."],
      ["Risiko dan potensi hasil", "Potensi hasil tidak pasti dan risiko mencakup kemungkinan kehilangan sebagian nilai. Klaim untung besar tanpa risiko harus diperiksa.", "Harga aset dapat naik atau turun karena pasar dan kondisi penerbit.", "Imbal hasil yang lalu tidak menjamin hasil masa depan."],
      ["Saham", "Saham mewakili kepemilikan bagian perusahaan. Harga dapat naik atau turun dan pembagian laba tidak dijamin.", "Pemegang saham perusahaan terbuka memiliki bagian sesuai jumlah saham yang dimiliki.", "Memiliki saham bukan berarti memiliki kendali penuh atas perusahaan."],
      ["Obligasi", "Obligasi merupakan surat utang dengan aturan pembayaran tertentu. Risiko penerbit, suku bunga, dan likuiditas perlu dipahami.", "Harga obligasi dapat berubah jika tingkat suku bunga pasar berubah.", "Obligasi bukan tabungan yang bebas risiko."],
      ["Reksa dana dan indeks", "Reksa dana mengumpulkan dana investor untuk dikelola sesuai kebijakan portofolio. Indeks merangkum kinerja sekumpulan aset menurut metodologi tertentu.", "Reksa dana indeks berupaya mengikuti acuan tertentu sesuai dokumen produk.", "Mengikuti indeks tidak menjamin untung dan tetap dapat mengalami penurunan."],
      ["Likuiditas dan diversifikasi", "Likuiditas adalah kemudahan menjual aset; diversifikasi menyebar penempatan untuk mengurangi ketergantungan pada satu aset.", "Simpanan kebutuhan dekat dipisahkan dari aset yang mungkin perlu waktu untuk dijual.", "Diversifikasi mengurangi konsentrasi, tetapi tidak menghapus seluruh risiko."],
      ["Volatilitas, biaya, dan penipuan", "Volatilitas menggambarkan naik-turun harga. Periksa biaya, legalitas, cara kerja, dan pihak yang menawarkan produk.", "Baca prospektus dan biaya transaksi sebelum mempertimbangkan produk investasi.", "Aplikasi rapi atau testimoni bukan bukti legalitas dan keuntungan."]
    ]],
    ["literasi-digital", "Keamanan Digital dan Penipuan Keuangan", [
      ["Data pribadi", "Batasi pembagian nomor identitas, alamat, dan data finansial. Berikan hanya ketika diperlukan pada layanan resmi dan pahami penggunaannya.", "Jangan mengunggah foto kartu bank ke media sosial.", "Nama atau tanggal lahir dapat membantu penipu menyusun pesan yang meyakinkan."],
      ["Password dan autentikasi", "Gunakan kata sandi unik dan panjang, pengelola kata sandi tepercaya bila sesuai, serta autentikasi tambahan yang tersedia.", "Kata sandi email sebaiknya berbeda dari akun belanja dan keuangan.", "Mengganti satu karakter pada kata sandi yang sama belum tentu cukup."],
      ["OTP dan PIN", "OTP, PIN, dan kode pemulihan adalah rahasia. Jangan memberikannya kepada penelepon atau mengirimkannya melalui pesan.", "Petugas resmi tidak perlu meminta kode OTP untuk memproses klaim hadiah.", "Mengaku sedang membantu bukan alasan untuk membagikan kode."],
      ["Phishing", "Phishing memakai pesan atau halaman palsu untuk mencuri kredensial. Periksa domain, konteks, dan permintaan data sebelum mengeklik.", "Ketik alamat situs bank sendiri atau buka aplikasi resmi, bukan tautan dari pesan mendesak.", "Logo yang benar dapat disalin oleh situs tiruan."],
      ["Social engineering", "Social engineering memanipulasi rasa takut, percaya, atau tergesa-gesa agar korban menyerahkan data atau uang.", "Penelepon meminta transfer untuk mengamankan rekening; tutup telepon lalu hubungi bank dari kanal resmi.", "Nomor telepon yang terlihat resmi dapat dipalsukan."],
      ["Aplikasi dan tautan palsu", "Unduh aplikasi dari toko resmi, periksa nama pengembang, izin aplikasi, dan kanal resmi penyedia.", "Cari nama aplikasi di toko resmi, lalu cocokkan pengembangnya dengan situs penyedia.", "Hasil pencarian iklan atau file kiriman tidak otomatis tepercaya."],
      ["Bukti pembayaran palsu", "Pastikan dana benar-benar masuk melalui aplikasi atau mutasi rekening sendiri; gambar bukti transfer dapat diedit.", "Penjual menunggu status transaksi di rekening, bukan hanya tangkapan layar pembeli.", "Tampilan notifikasi bukan pengganti verifikasi saldo."],
      ["Respons insiden", "Jika data terlanjur dibagikan, hubungi penyedia layanan melalui kanal resmi, ganti kredensial terkait, blokir akses jika tersedia, dan laporkan.", "Simpan bukti komunikasi dan hubungi bank sesegera mungkin bila ada transaksi tak dikenal.", "Jangan membayar pihak yang mengaku dapat memulihkan dana dengan meminta OTP."]
    ]],
    ["literasi-usaha", "Penghasilan dan Usaha", [
      ["Sumber penghasilan", "Penghasilan dapat berasal dari upah, jasa, usaha, atau sumber lain. Keberlanjutan dan kepastian tiap sumber berbeda.", "Siswa menerima upah proyek desain dan mencatat tanggal pembayaran serta biaya kuota.", "Omzet proyek satu kali bukan pendapatan rutin yang dijamin."],
      ["Pendapatan dan biaya", "Pendapatan usaha adalah nilai penjualan; biaya adalah sumber daya yang dipakai. Laba sederhana menghitung selisih keduanya dalam periode yang sama.", "Penjualan Rp500.000 dengan biaya langsung Rp320.000 menyisakan Rp180.000 sebelum biaya lain.", "Omzet bukan laba."],
      ["Modal awal", "Modal mencakup dana dan aset yang dibutuhkan untuk memulai; rencanakan berdasarkan kebutuhan, bukan pinjaman maksimal yang tersedia.", "Mulai dengan alat yang sudah tersedia sebelum membeli perlengkapan tambahan.", "Modal besar tidak menjamin pelanggan atau keuntungan."],
      ["Biaya tetap dan variabel", "Biaya tetap relatif tidak bergantung langsung pada jumlah unit dalam rentang tertentu; biaya variabel cenderung mengikuti volume produksi.", "Biaya sewa lapak dapat tetap, sedangkan bahan minuman bertambah tiap gelas.", "Biaya tetap dapat berubah jika kontrak atau kapasitas berubah."],
      ["Harga jual", "Harga perlu mempertimbangkan biaya, nilai untuk pelanggan, alternatif pasar, dan kemampuan usaha beroperasi.", "Hitung bahan, kemasan, gas, serta waktu kerja sebelum menetapkan harga kue.", "Menyalin harga pesaing tidak memastikan biaya sendiri tertutup."],
      ["Omzet dan laba", "Omzet adalah total penjualan; laba memperhitungkan pendapatan dikurangi biaya. Catat periode dan jenis biaya yang dihitung.", "Omzet Rp1 juta tidak berarti laba Rp1 juta karena bahan dan ongkir masih dibayar.", "Saldo kas dan laba dapat berbeda jika ada utang atau piutang."],
      ["Arus kas", "Arus kas mencatat kapan uang masuk dan keluar. Usaha dapat kekurangan kas meskipun penjualan tercatat jika pelanggan belum membayar.", "Sediakan uang untuk membeli bahan sebelum pelanggan membayar faktur.", "Laba di catatan tidak otomatis berarti kas tersedia hari ini."],
      ["Titik impas dan risiko", "Titik impas adalah volume penjualan saat pendapatan setara biaya total dalam model sederhana. Perkiraan bergantung asumsi biaya dan harga.", "Biaya tetap Rp100.000 dan kontribusi Rp5.000 per porsi memerlukan 20 porsi untuk menutup biaya tetap.", "Titik impas bukan target laba dan tidak menjamin permintaan tercapai."]
    ]],
    ["literasi-masa-depan", "Perencanaan Keuangan Masa Depan", [
      ["Tujuan jangka pendek dan panjang", "Tujuan dibedakan menurut waktu dan kebutuhan akses. Rencana dapat menggabungkan target dekat dan jauh sesuai kapasitas.", "Tabungan alat praktik semester ini berbeda dari biaya pendidikan setelah lulus.", "Jangka panjang tidak selalu berarti harus mengambil risiko besar."],
      ["Rencana setelah lulus", "Perkirakan perubahan pemasukan, tempat tinggal, transportasi, pendidikan, dan tanggung jawab setelah sekolah.", "Buat beberapa skenario biaya jika melanjutkan kuliah, pelatihan, atau mulai bekerja.", "Satu jalur karier tidak harus cocok bagi semua siswa."],
      ["Penghasilan pertama", "Saat menerima penghasilan, kenali jumlah bersih, tanggal pembayaran, kewajiban, dan manfaat kerja sebelum membagi uang.", "Periksa slip gaji dan potongan, lalu rencanakan pengeluaran rutin.", "Gaji kotor dan uang yang diterima dapat berbeda."],
      ["Anggaran ketika bekerja", "Anggaran kerja mempertimbangkan transportasi, makan, kontribusi keluarga, tagihan, tabungan, dan biaya yang muncul berkala.", "Sisihkan ongkos bulanan dan dana untuk perlengkapan kerja sebelum menetapkan belanja fleksibel.", "Rasio anggaran populer bukan aturan wajib."],
      ["Pendidikan dan pelatihan", "Bandingkan biaya pendidikan dengan durasi, kualitas, kebutuhan pasar, dukungan beasiswa, dan peluang yang realistis.", "Cari informasi biaya, jadwal, persyaratan beasiswa, dan biaya hidup dari sumber resmi.", "Biaya tinggi tidak otomatis berarti hasil kerja terjamin."],
      ["Dana darurat dan perlindungan", "Simpan dana untuk gangguan pendapatan atau kebutuhan mendesak; pelajari perlindungan sesuai risiko dan syaratnya.", "Setelah mulai bekerja, bangun simpanan berkala sesuai kemampuan sebelum menambah kewajiban baru.", "Dana darurat dan asuransi memiliki fungsi berbeda dan tidak saling menggantikan sepenuhnya."],
      ["Meninjau tujuan", "Tinjau kemajuan, perubahan keadaan, dan asumsi secara berkala. Ubah target bila kebutuhan atau kemampuan berubah.", "Jika jadwal pendidikan maju, sesuaikan setoran dan kurangi target lain yang fleksibel.", "Mengubah rencana berdasarkan informasi bukan kegagalan."],
      ["Menyesuaikan rencana", "Rencana yang tangguh memiliki alternatif untuk beberapa kondisi dan menghindari ketergantungan pada satu hasil yang belum pasti.", "Siapkan opsi transportasi dan anggaran jika tempat kerja berpindah.", "Perencanaan tidak menghilangkan ketidakpastian, tetapi membantu meresponsnya."]
    ]]
  ];

  const literacyChapters = literacyRows.map((row, chapterIndex) => ({
    id: "literasi-" + row[0].replace("literasi-", ""),
    slug: row[0],
    track: "literasi",
    title: row[1],
    number: String(chapterIndex + 1).padStart(2, "0"),
    description: "Jalur Literasi Keuangan · " + row[1] + ". Pahami konsep melalui contoh sehari-hari di Indonesia.",
    icon: ["◈", "▤", "↗", "⌖", "⌁", "◇", "↗", "◌"][chapterIndex],
    lessons: row[2].map((item, lessonIndex) => ({
      id: row[0] + "-" + String(lessonIndex + 1).padStart(2, "0"),
      title: item[0],
      opener: "Bagaimana konsep " + item[0].toLowerCase() + " membantumu membuat keputusan yang lebih terencana?",
      concept: item[1],
      example: item[2],
      takeaway: item[1].split(".")[0] + ".",
      practice: "Pernyataan yang paling sesuai tentang " + item[0].toLowerCase() + " adalah ...",
      options: [item[1].split(".")[0], item[3].split(".")[0], "Semua orang harus menggunakan pilihan yang sama", "Hasilnya selalu terjamin dan bebas risiko"],
      answer: 0,
      explanation: item[1] + " Contoh penerapan: " + item[2],
      misconception: item[3],
      minutes: 5,
      objective: "Menjelaskan " + item[0].toLowerCase() + " dan menghubungkannya dengan pilihan keuangan sehari-hari.",
      terms: item[1]
    }))
  }));

  const curriculumChapters = [
    ["10", "Pengantar Ilmu Ekonomi", "Memahami pilihan manusia dalam mengelola sumber daya yang terbatas.", "Keluarga memilih penggunaan uang bulanan sementara usaha menentukan produk yang dibuat."],
    ["10", "Kelangkaan, Kebutuhan, dan Biaya Peluang", "Menganalisis keterbatasan sumber daya, ragam kebutuhan, dan pilihan alternatif terbaik.", "Memilih bekerja paruh waktu dapat mengurangi waktu belajar atau beristirahat."],
    ["10", "Masalah dan Sistem Ekonomi", "Membandingkan cara masyarakat menjawab apa, bagaimana, dan untuk siapa barang diproduksi.", "Koperasi sekolah, usaha keluarga, dan layanan publik memiliki bentuk pengambilan keputusan berbeda."],
    ["10", "Kegiatan dan Pelaku Ekonomi", "Menghubungkan produksi, distribusi, konsumsi, serta rumah tangga dan pemerintah.", "Petani memasok sayur ke pasar, pedagang menyalurkan, lalu keluarga membeli."],
    ["10", "Permintaan dan Penawaran", "Membaca pengaruh harga dan faktor lain terhadap jumlah yang diminta dan ditawarkan.", "Permintaan minuman dingin dapat berubah saat cuaca panas."],
    ["10", "Harga Keseimbangan", "Menjelaskan harga yang terbentuk saat jumlah diminta dan ditawarkan berinteraksi.", "Harga buah di pasar dapat berubah ketika pasokan panen berkurang."],
    ["10", "Pasar dan Struktur Pasar", "Mengenali bentuk persaingan, jumlah pelaku, dan pilihan konsumen.", "Warung di sekitar sekolah bersaing melalui lokasi, harga, mutu, dan layanan."],
    ["10", "Uang dan Sistem Pembayaran", "Menjelaskan fungsi uang dan ragam pembayaran tunai serta digital.", "Pembayaran QRIS memudahkan pertukaran tetapi tetap perlu menjaga keamanan akun."],
    ["10", "Bank dan Lembaga Keuangan", "Mengenali layanan dasar lembaga keuangan dan pentingnya memahami syarat.", "Bandingkan biaya rekening dan akses layanan dari informasi resmi."],
    ["10", "Koperasi dan Ekonomi Kerakyatan", "Memahami prinsip kerja sama dan partisipasi dalam koperasi.", "Anggota koperasi sekolah dapat berpartisipasi sesuai aturan dan tanggung jawab."],
    ["10", "Literasi Keuangan Dasar", "Menerapkan anggaran, tujuan tabungan, serta kebiasaan aman dalam keputusan sederhana.", "Catat uang saku mingguan dan sisihkan biaya ongkos lebih dahulu."],
    ["11", "Pendapatan Nasional", "Memahami ukuran agregat produksi dan pendapatan serta batas interpretasinya.", "PDB merangkum nilai produksi, tetapi tidak menjelaskan pemerataan pendapatan sendirian."],
    ["11", "Pertumbuhan dan Pembangunan Ekonomi", "Membedakan perubahan output ekonomi dengan peningkatan kesejahteraan yang lebih luas.", "Pertumbuhan perlu dilihat bersama akses pendidikan, kesehatan, dan pemerataan."],
    ["11", "Ketenagakerjaan", "Mengenali angkatan kerja, kesempatan kerja, upah, dan keterampilan.", "Pelatihan vokasi dapat membantu menyesuaikan keterampilan dengan kebutuhan pekerjaan."],
    ["11", "Pengangguran", "Menganalisis jenis pengangguran dan faktor yang dapat memengaruhi transisi kerja.", "Perubahan teknologi dapat mengurangi sebagian pekerjaan dan menciptakan kebutuhan keterampilan baru."],
    ["11", "Inflasi dan Daya Beli", "Menghubungkan perubahan harga umum dengan daya beli rumah tangga.", "Bandingkan harga keranjang belanja lintas waktu, bukan satu barang saja."],
    ["11", "Kebijakan Fiskal dan APBN", "Mengenali peran penerimaan dan belanja negara dalam APBN.", "Belanja pendidikan dan infrastruktur tercatat dalam dokumen anggaran publik."],
    ["11", "Kebijakan Moneter dan Perbankan", "Memahami peran kebijakan moneter dan sistem perbankan secara pengantar.", "Perubahan suku bunga kebijakan dapat memengaruhi biaya pendanaan dengan jeda dan melalui berbagai saluran."],
    ["11", "Perpajakan", "Menjelaskan fungsi pajak dan pentingnya merujuk peraturan resmi yang berlaku.", "Kewajiban pajak usaha bergantung jenis dan keadaan wajib pajak."],
    ["11", "Perdagangan Internasional", "Menganalisis alasan perdagangan dan dampaknya terhadap produsen serta konsumen.", "Indonesia mengimpor sebagian bahan baku dan mengekspor berbagai komoditas."],
    ["11", "Kurs Valuta Asing", "Memahami nilai tukar dan pengaruhnya terhadap transaksi lintas mata uang.", "Biaya perjalanan luar negeri berubah ketika kurs dan biaya penukaran berubah."],
    ["11", "Ekonomi Digital dan Kewirausahaan", "Menilai peluang platform digital bersama biaya, perlindungan data, dan risiko.", "Penjual daring menghitung komisi platform dan ongkir sebelum menetapkan harga."],
    ["12", "Akuntansi Dasar dan Informasi Keuangan", "Mengenali pencatatan transaksi dan informasi sederhana untuk membuat keputusan.", "Catat pemasukan dan pengeluaran proyek kelas secara konsisten."],
    ["12", "Manajemen Keuangan Pribadi", "Menghubungkan anggaran, tabungan, kewajiban, dan tujuan pribadi.", "Buat rencana uang saku dengan pos kebutuhan dan evaluasi mingguan."],
    ["12", "Perencanaan Keuangan", "Menyusun sasaran keuangan dengan asumsi, jangka waktu, dan evaluasi.", "Rencanakan biaya sertifikasi setelah lulus serta alternatif bila jadwal berubah."],
    ["12", "Investasi dan Pasar Modal", "Mengenali instrumen pasar modal, risiko, biaya, dan sumber informasi resmi.", "Baca dokumen produk dan pahami bahwa nilai aset dapat turun."],
    ["12", "Analisis Risiko", "Mengidentifikasi ketidakpastian, dampak, dan cara mengurangi konsentrasi risiko.", "Usaha makanan mempertimbangkan risiko bahan rusak dan ketergantungan pada satu pemasok."],
    ["12", "Pengambilan Keputusan Keuangan", "Membandingkan alternatif menggunakan biaya total, tujuan, risiko, dan waktu.", "Bandingkan membeli perangkat tunai dengan cicilan setelah menghitung seluruh biaya."],
    ["12", "Kewirausahaan dan Studi Kelayakan", "Mengukur kebutuhan pelanggan, biaya, arus kas, dan titik impas secara sederhana.", "Uji resep minuman dalam kelompok kecil sebelum produksi untuk acara sekolah."],
    ["12", "Ekonomi Global", "Menjelaskan keterhubungan ekonomi dunia dan kemungkinan rambatannya.", "Perubahan harga energi global dapat memengaruhi biaya transportasi dan produksi."],
    ["12", "Perlindungan Konsumen", "Mengenali hak konsumen, informasi produk, kanal pengaduan, dan praktik yang merugikan.", "Simpan bukti transaksi dan baca syarat pengembalian sebelum membeli daring."],
    ["12", "Keamanan Keuangan Digital", "Menerapkan perlindungan akun dan respons awal terhadap penipuan digital.", "Jangan bagikan OTP; verifikasi permintaan melalui aplikasi resmi yang dibuka sendiri."],
    ["12", "Perencanaan Karier dan Keuangan Masa Depan", "Menghubungkan pilihan karier, peningkatan keterampilan, pemasukan, dan tujuan masa depan.", "Bandingkan biaya pelatihan dengan jadwal, dukungan beasiswa, dan pilihan kerja."]
  ];

  const curriculum = curriculumChapters.map((item, index) => {
    const grade = Number(item[0]);
    const slug = "k" + item[0] + "-" + String(index + 1).padStart(2, "0");
    return {
      id: slug, grade, title: item[1], summary: item[2], example: item[3],
      enrichment: true,
      semester: index % 2 === 0 ? 1 : 2,
      lessons: [
        {
          id: slug + "-konsep", title: "Memahami " + item[1],
          opener: "Apa yang dapat kita pelajari dari situasi berikut: " + item[3],
          objective: "Menjelaskan gagasan utama " + item[1].toLowerCase() + " dan mengenali faktor yang relevan.",
          concept: item[2] + " Dalam analisis, bedakan fakta yang tersedia dari asumsi dan pertimbangkan siapa yang terdampak.",
          example: item[3],
          takeaway: "Gunakan konsep untuk menjelaskan situasi, bukan sekadar menghafal istilah.",
          practice: "Langkah awal yang paling membantu untuk menganalisis " + item[1].toLowerCase() + " adalah ...",
          options: ["Mengidentifikasi informasi dan konteks sebelum menarik kesimpulan", "Menganggap satu contoh berlaku untuk semua orang", "Mengabaikan pihak yang terdampak", "Memilih jawaban tanpa memeriksa asumsi"],
          answer: 0,
          explanation: item[2] + " Analisis yang baik memisahkan fakta dari asumsi dan menyebutkan batas informasi yang tersedia.",
          minutes: 7,
          terms: item[2]
        },
        {
          id: slug + "-penerapan", title: "Menerapkan konsep: " + item[1],
          opener: "Bagaimana kamu menguji penjelasan ekonomi tanpa menganggap satu contoh mewakili semua keadaan?",
          objective: "Menerapkan " + item[1].toLowerCase() + " pada contoh dan menyebutkan batas kesimpulan.",
          concept: "Mulai dengan pertanyaan, tuliskan informasi yang diketahui, jelaskan hubungan antar faktor, lalu nyatakan hal yang belum dapat disimpulkan. Periksa sumber bila membahas angka atau peraturan terkini.",
          example: item[3] + " Diskusikan faktor lain yang mungkin mengubah hasil dan data apa yang perlu dikumpulkan.",
          takeaway: "Kesimpulan yang baik menyebutkan alasan, konteks, dan batas informasi.",
          practice: "Saat menerapkan " + item[1].toLowerCase() + ", kesimpulan yang paling bertanggung jawab adalah ...",
          options: ["Menyebut alasan, konteks, dan informasi yang masih perlu diperiksa", "Menyatakan hasil pasti dari satu contoh", "Mengabaikan perubahan keadaan", "Memilih klaim paling meyakinkan tanpa bukti"],
          answer: 0,
          explanation: item[2] + " Gunakan contoh sebagai bahan berpikir, bukan sebagai bukti bahwa hasil yang sama pasti terjadi di semua keadaan.",
          minutes: 8,
          terms: item[2]
        }
      ]
    };
  });
  window.ECONOVA_LEARNING_PATHS = { literacyChapters, curriculum };
})();
