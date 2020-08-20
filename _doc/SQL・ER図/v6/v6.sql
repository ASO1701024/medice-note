-- phpMyAdmin SQL Dump
-- version 5.0.1
-- https://www.phpmyadmin.net/
--
-- ホスト: localhost
-- 生成日時: 2020 年 8 月 18 日 05:08
-- サーバのバージョン： 10.4.11-MariaDB
-- PHP のバージョン: 7.4.2

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- データベース: `medice-note`
--

-- --------------------------------------------------------

--
-- テーブルの構造 `line_login`
--

CREATE TABLE `line_login` (
  `user_id` int(8) NOT NULL COMMENT 'ユーザーID',
  `line_user_name` varchar(255) COLLATE utf8mb4_bin NOT NULL COMMENT 'LINEユーザー名',
  `access_token` varchar(255) COLLATE utf8mb4_bin NOT NULL COMMENT 'アクセストークン',
  `refresh_token` varchar(255) COLLATE utf8mb4_bin NOT NULL COMMENT 'リフレッシュトークン'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `line_notice_user_id`
--

CREATE TABLE `line_notice_user_id` (
  `user_id` int(8) NOT NULL COMMENT 'ユーザーID',
  `line_user_id` varchar(255) COLLATE utf8mb4_bin NOT NULL COMMENT 'LINEユーザーID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `medicine`
--

CREATE TABLE `medicine` (
  `medicine_id` int(8) NOT NULL COMMENT '薬ID',
  `medicine_name` varchar(255) COLLATE utf8mb4_bin NOT NULL COMMENT '薬名',
  `hospital_name` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT '病院名',
  `number` int(2) NOT NULL COMMENT '飲む個数',
  `starts_date` date NOT NULL COMMENT '処方日',
  `period` int(8) NOT NULL COMMENT '服用日数',
  `type_id` int(4) NOT NULL COMMENT '薬種別ID',
  `image` varchar(100) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '薬画像',
  `description` varchar(255) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '薬説明',
  `group_id` int(8) NOT NULL COMMENT '所属グループ'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `medicine_group`
--

CREATE TABLE `medicine_group` (
  `group_id` int(8) NOT NULL COMMENT 'グループID',
  `group_name` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT 'グループ名',
  `user_id` int(8) NOT NULL COMMENT '作成者ID',
  `is_deletable` tinyint(1) NOT NULL DEFAULT 0 COMMENT '削除可能フラグ'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `medicine_take_time`
--

CREATE TABLE `medicine_take_time` (
  `medicine_id` int(8) NOT NULL COMMENT '薬ID',
  `take_time_id` int(8) NOT NULL COMMENT '服用時刻ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `medicine_type`
--

CREATE TABLE `medicine_type` (
  `type_id` int(4) NOT NULL COMMENT '薬種別ID',
  `type_name` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT '薬種別名'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

--
-- テーブルのデータのダンプ `medicine_type`
--

INSERT INTO `medicine_type` (`type_id`, `type_name`) VALUES
(1, '第一種医薬品'),
(2, '第二種医薬品'),
(3, '第三種医薬品'),
(4, '新薬'),
(5, 'ジェネリック医薬品'),
(6, '粉薬'),
(7, 'シロップ剤'),
(8, '錠剤'),
(9, 'カプセル剤'),
(10, '内用剤'),
(11, '外用剤'),
(12, '軟膏'),
(13, '貼り薬'),
(14, '点眼剤'),
(15, 'トローチ'),
(16, '吸入剤'),
(17, '注射剤'),
(18, 'その他');

-- --------------------------------------------------------

--
-- テーブルの構造 `notice`
--

CREATE TABLE `notice` (
  `notice_id` int(8) NOT NULL COMMENT '通知ID',
  `notice_name` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT '通知名',
  `notice_period` date NOT NULL COMMENT '通知期間',
  `is_enable` tinyint(1) NOT NULL DEFAULT 1 COMMENT '実行フラグ',
  `user_id` int(8) DEFAULT NULL COMMENT 'ユーザーID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `notice_day`
--

CREATE TABLE `notice_day` (
  `notice_id` int(8) NOT NULL COMMENT '通知ID',
  `day_of_week` int(1) NOT NULL COMMENT '曜日'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `notice_medicine`
--

CREATE TABLE `notice_medicine` (
  `notice_id` int(8) NOT NULL COMMENT '通知ID',
  `medicine_id` int(8) NOT NULL COMMENT '薬ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `notice_time`
--

CREATE TABLE `notice_time` (
  `notice_id` int(8) NOT NULL COMMENT '通知ID',
  `notice_time` time NOT NULL COMMENT '時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `session`
--

CREATE TABLE `session` (
  `user_id` int(8) NOT NULL COMMENT 'ユーザーID',
  `session_id` varchar(32) COLLATE utf8mb4_bin NOT NULL COMMENT 'セッションID',
  `expired_at` datetime NOT NULL COMMENT '失効日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `take_time`
--

CREATE TABLE `take_time` (
  `take_time_id` int(8) NOT NULL COMMENT '服用時刻ID',
  `take_time_name` varchar(10) COLLATE utf8mb4_bin NOT NULL COMMENT '服用時刻名'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

--
-- テーブルのデータのダンプ `take_time`
--

INSERT INTO `take_time` (`take_time_id`, `take_time_name`) VALUES
(1, '朝'),
(2, '昼'),
(3, '夕'),
(4, '起床'),
(5, '食前'),
(6, '食後'),
(7, '食間'),
(8, '寝る前'),
(9, '頓服'),
(10, 'その他');

-- --------------------------------------------------------

--
-- テーブルの構造 `user`
--

CREATE TABLE `user` (
  `user_id` int(8) NOT NULL COMMENT 'ユーザーID',
  `user_name` varchar(20) COLLATE utf8mb4_bin NOT NULL COMMENT 'ユーザー名',
  `mail` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT 'メールアドレス',
  `password` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT 'パスワード',
  `is_enable` tinyint(1) NOT NULL DEFAULT 0 COMMENT '有効フラグ',
  `deleted_at` date DEFAULT NULL COMMENT '削除日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `user_authentication_key`
--

CREATE TABLE `user_authentication_key` (
  `user_id` int(8) NOT NULL COMMENT 'ユーザーID',
  `authentication_key` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT '新規アカウント認証キー',
  `expires_at` datetime NOT NULL COMMENT '失効日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `user_login_log`
--

CREATE TABLE `user_login_log` (
  `login_log_id` int(10) NOT NULL COMMENT 'ログインログID',
  `mail` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT '入力メールアドレス',
  `user_agent` varchar(255) COLLATE utf8mb4_bin NOT NULL COMMENT 'ユーザーエージェント',
  `ip_address` varchar(50) COLLATE utf8mb4_bin NOT NULL COMMENT 'IPアドレス',
  `login_at` datetime NOT NULL COMMENT 'ログイン試行日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `user_message`
--

CREATE TABLE `user_message` (
  `message_id` int(8) NOT NULL COMMENT 'メッセージID',
  `user_id` int(8) NOT NULL COMMENT 'ユーザーID',
  `message` text COLLATE utf8mb4_bin NOT NULL COMMENT 'メッセージ',
  `message_flg` int(1) NOT NULL COMMENT 'メッセージフラグ'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `user_reset_password_key`
--

CREATE TABLE `user_reset_password_key` (
  `user_id` int(8) NOT NULL COMMENT 'ユーザーID',
  `reset_password_key` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT 'パスワード再設定キー',
  `expires_at` datetime NOT NULL COMMENT '失効日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

--
-- ダンプしたテーブルのインデックス
--

--
-- テーブルのインデックス `line_login`
--
ALTER TABLE `line_login`
  ADD PRIMARY KEY (`user_id`);

--
-- テーブルのインデックス `line_notice_user_id`
--
ALTER TABLE `line_notice_user_id`
  ADD PRIMARY KEY (`user_id`);

--
-- テーブルのインデックス `medicine`
--
ALTER TABLE `medicine`
  ADD PRIMARY KEY (`medicine_id`),
  ADD KEY `medicine_medicine_group_group_id_fk` (`group_id`),
  ADD KEY `medicine_medicine_type_type_id_fk` (`type_id`);

--
-- テーブルのインデックス `medicine_group`
--
ALTER TABLE `medicine_group`
  ADD PRIMARY KEY (`group_id`),
  ADD KEY `medicine_group_user_user_id_fk` (`user_id`);

--
-- テーブルのインデックス `medicine_take_time`
--
ALTER TABLE `medicine_take_time`
  ADD UNIQUE KEY `medicine_take_time_pk` (`medicine_id`,`take_time_id`),
  ADD KEY `medicine_take_time_take_time_take_time_id_fk` (`take_time_id`);

--
-- テーブルのインデックス `medicine_type`
--
ALTER TABLE `medicine_type`
  ADD PRIMARY KEY (`type_id`);

--
-- テーブルのインデックス `notice`
--
ALTER TABLE `notice`
  ADD PRIMARY KEY (`notice_id`),
  ADD KEY `notice_user_user_id_fk` (`user_id`);

--
-- テーブルのインデックス `notice_day`
--
ALTER TABLE `notice_day`
  ADD PRIMARY KEY (`notice_id`,`day_of_week`);

--
-- テーブルのインデックス `notice_medicine`
--
ALTER TABLE `notice_medicine`
  ADD PRIMARY KEY (`notice_id`,`medicine_id`),
  ADD KEY `notice_medicine_medicine_medicine_id_fk` (`medicine_id`);

--
-- テーブルのインデックス `notice_time`
--
ALTER TABLE `notice_time`
  ADD PRIMARY KEY (`notice_id`,`notice_time`);

--
-- テーブルのインデックス `session`
--
ALTER TABLE `session`
  ADD UNIQUE KEY `session_session_id_uindex` (`session_id`),
  ADD KEY `session_user_user_id_fk` (`user_id`);

--
-- テーブルのインデックス `take_time`
--
ALTER TABLE `take_time`
  ADD PRIMARY KEY (`take_time_id`);

--
-- テーブルのインデックス `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `user_mail_uindex` (`mail`);

--
-- テーブルのインデックス `user_authentication_key`
--
ALTER TABLE `user_authentication_key`
  ADD UNIQUE KEY `user_authentication_key_authentication_key_uindex` (`authentication_key`),
  ADD KEY `user_authentication_key_user_user_id_fk` (`user_id`);

--
-- テーブルのインデックス `user_login_log`
--
ALTER TABLE `user_login_log`
  ADD PRIMARY KEY (`login_log_id`);

--
-- テーブルのインデックス `user_message`
--
ALTER TABLE `user_message`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `user_message_user_user_id_fk` (`user_id`);

--
-- テーブルのインデックス `user_reset_password_key`
--
ALTER TABLE `user_reset_password_key`
  ADD UNIQUE KEY `user_reset_password_key_reset_password_key_uindex` (`reset_password_key`),
  ADD KEY `user_reset_password_key_user_user_id_fk` (`user_id`);

--
-- ダンプしたテーブルのAUTO_INCREMENT
--

--
-- テーブルのAUTO_INCREMENT `medicine`
--
ALTER TABLE `medicine`
  MODIFY `medicine_id` int(8) NOT NULL AUTO_INCREMENT COMMENT '薬ID';

--
-- テーブルのAUTO_INCREMENT `medicine_group`
--
ALTER TABLE `medicine_group`
  MODIFY `group_id` int(8) NOT NULL AUTO_INCREMENT COMMENT 'グループID';

--
-- テーブルのAUTO_INCREMENT `medicine_type`
--
ALTER TABLE `medicine_type`
  MODIFY `type_id` int(4) NOT NULL AUTO_INCREMENT COMMENT '薬種別ID', AUTO_INCREMENT=19;

--
-- テーブルのAUTO_INCREMENT `notice`
--
ALTER TABLE `notice`
  MODIFY `notice_id` int(8) NOT NULL AUTO_INCREMENT COMMENT '通知ID';

--
-- テーブルのAUTO_INCREMENT `take_time`
--
ALTER TABLE `take_time`
  MODIFY `take_time_id` int(8) NOT NULL AUTO_INCREMENT COMMENT '服用時刻ID', AUTO_INCREMENT=11;

--
-- テーブルのAUTO_INCREMENT `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(8) NOT NULL AUTO_INCREMENT COMMENT 'ユーザーID';

--
-- テーブルのAUTO_INCREMENT `user_login_log`
--
ALTER TABLE `user_login_log`
  MODIFY `login_log_id` int(10) NOT NULL AUTO_INCREMENT COMMENT 'ログインログID';

--
-- テーブルのAUTO_INCREMENT `user_message`
--
ALTER TABLE `user_message`
  MODIFY `message_id` int(8) NOT NULL AUTO_INCREMENT COMMENT 'メッセージID';

--
-- ダンプしたテーブルの制約
--

--
-- テーブルの制約 `line_login`
--
ALTER TABLE `line_login`
  ADD CONSTRAINT `line_login_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

--
-- テーブルの制約 `line_notice_user_id`
--
ALTER TABLE `line_notice_user_id`
  ADD CONSTRAINT `line_notice_user_id_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

--
-- テーブルの制約 `medicine`
--
ALTER TABLE `medicine`
  ADD CONSTRAINT `medicine_medicine_group_group_id_fk` FOREIGN KEY (`group_id`) REFERENCES `medicine_group` (`group_id`),
  ADD CONSTRAINT `medicine_medicine_type_type_id_fk` FOREIGN KEY (`type_id`) REFERENCES `medicine_type` (`type_id`);

--
-- テーブルの制約 `medicine_group`
--
ALTER TABLE `medicine_group`
  ADD CONSTRAINT `medicine_group_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

--
-- テーブルの制約 `medicine_take_time`
--
ALTER TABLE `medicine_take_time`
  ADD CONSTRAINT `medicine_take_time_medicine_medicine_id_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicine` (`medicine_id`),
  ADD CONSTRAINT `medicine_take_time_take_time_take_time_id_fk` FOREIGN KEY (`take_time_id`) REFERENCES `take_time` (`take_time_id`);

--
-- テーブルの制約 `notice`
--
ALTER TABLE `notice`
  ADD CONSTRAINT `notice_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

--
-- テーブルの制約 `notice_day`
--
ALTER TABLE `notice_day`
  ADD CONSTRAINT `notice_day_notice_notice_id_fk` FOREIGN KEY (`notice_id`) REFERENCES `notice` (`notice_id`);

--
-- テーブルの制約 `notice_medicine`
--
ALTER TABLE `notice_medicine`
  ADD CONSTRAINT `notice_medicine_medicine_medicine_id_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicine` (`medicine_id`),
  ADD CONSTRAINT `notice_medicine_notice_notice_id_fk` FOREIGN KEY (`notice_id`) REFERENCES `notice` (`notice_id`);

--
-- テーブルの制約 `notice_time`
--
ALTER TABLE `notice_time`
  ADD CONSTRAINT `notice_time_notice_notice_id_fk` FOREIGN KEY (`notice_id`) REFERENCES `notice` (`notice_id`);

--
-- テーブルの制約 `session`
--
ALTER TABLE `session`
  ADD CONSTRAINT `session_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

--
-- テーブルの制約 `user_authentication_key`
--
ALTER TABLE `user_authentication_key`
  ADD CONSTRAINT `user_authentication_key_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

--
-- テーブルの制約 `user_message`
--
ALTER TABLE `user_message`
  ADD CONSTRAINT `user_message_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

--
-- テーブルの制約 `user_reset_password_key`
--
ALTER TABLE `user_reset_password_key`
  ADD CONSTRAINT `user_reset_password_key_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
