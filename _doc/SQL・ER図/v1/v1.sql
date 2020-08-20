-- phpMyAdmin SQL Dump
-- version 5.0.1
-- https://www.phpmyadmin.net/
--
-- ホスト: localhost
-- 生成日時: 2020 年 6 月 09 日 15:45
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
-- データベース: `medice_note`
--

-- --------------------------------------------------------

--
-- テーブルの構造 `access_log`
--

CREATE TABLE `access_log` (
  `access_log_id` int(10) NOT NULL COMMENT 'アクセスログID',
  `user_id` int(8) NOT NULL COMMENT 'ユーザーID',
  `action_id` int(8) NOT NULL COMMENT 'アクションID',
  `access_at` datetime NOT NULL COMMENT '操作日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `action`
--

CREATE TABLE `action` (
  `action_id` int(8) NOT NULL COMMENT 'アクションID',
  `action_name` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT 'アクション名'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- テーブルの構造 `medicine`
--

CREATE TABLE `medicine` (
  `medicine_id` int(8) NOT NULL COMMENT '薬ID',
  `medicine_name` varchar(255) COLLATE utf8mb4_bin NOT NULL COMMENT '薬名',
  `number` int(2) NOT NULL COMMENT '飲む個数',
  `take_time` time NOT NULL COMMENT '飲む時間',
  `adjustment_time` int(4) NOT NULL COMMENT '調整時間',
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
-- テーブルの構造 `medicine_type`
--

CREATE TABLE `medicine_type` (
  `type_id` int(4) NOT NULL COMMENT '薬種別ID',
  `type_name` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT '薬種別名'
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
-- テーブルのインデックス `access_log`
--
ALTER TABLE `access_log`
  ADD PRIMARY KEY (`access_log_id`),
  ADD KEY `access_log_action_action_id_fk` (`action_id`),
  ADD KEY `access_log_user_user_id_fk` (`user_id`);

--
-- テーブルのインデックス `action`
--
ALTER TABLE `action`
  ADD PRIMARY KEY (`action_id`);

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
-- テーブルのインデックス `medicine_type`
--
ALTER TABLE `medicine_type`
  ADD PRIMARY KEY (`type_id`);

--
-- テーブルのインデックス `session`
--
ALTER TABLE `session`
  ADD UNIQUE KEY `session_session_id_uindex` (`session_id`),
  ADD KEY `session_user_user_id_fk` (`user_id`);

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
-- テーブルのインデックス `user_reset_password_key`
--
ALTER TABLE `user_reset_password_key`
  ADD UNIQUE KEY `user_reset_password_key_reset_password_key_uindex` (`reset_password_key`),
  ADD KEY `user_reset_password_key_user_user_id_fk` (`user_id`);

--
-- ダンプしたテーブルのAUTO_INCREMENT
--

--
-- テーブルのAUTO_INCREMENT `access_log`
--
ALTER TABLE `access_log`
  MODIFY `access_log_id` int(10) NOT NULL AUTO_INCREMENT COMMENT 'アクセスログID';

--
-- テーブルのAUTO_INCREMENT `action`
--
ALTER TABLE `action`
  MODIFY `action_id` int(8) NOT NULL AUTO_INCREMENT COMMENT 'アクションID';

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
  MODIFY `type_id` int(4) NOT NULL AUTO_INCREMENT COMMENT '薬種別ID';

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
-- ダンプしたテーブルの制約
--

--
-- テーブルの制約 `access_log`
--
ALTER TABLE `access_log`
  ADD CONSTRAINT `access_log_action_action_id_fk` FOREIGN KEY (`action_id`) REFERENCES `action` (`action_id`),
  ADD CONSTRAINT `access_log_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

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
-- テーブルの制約 `user_reset_password_key`
--
ALTER TABLE `user_reset_password_key`
  ADD CONSTRAINT `user_reset_password_key_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
