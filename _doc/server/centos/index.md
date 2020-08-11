## Nginx Setup
> 環境はGoogle Cloud PlatformのCompute EngineのCentOS 7イメージを想定しています

> ***インストール時は最新のドキュメントにしたがってインストールするべきです***  
> <https://nginx.org/en/linux_packages.html#RHEL-CentOS>

> すべての作業をrootユーザーとして実行しています、しかし、これは避けるべきです

yum-utilsをインストールします  
```
yum install yum-utils
```

### Create File
nginx.repoファイルを作成します
```
vi /etc/yum.repos.d/nginx.repo
```
下記の内容を記入し、`!wq`で保存し終了します
```
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true

[nginx-mainline]
name=nginx mainline repo
baseurl=http://nginx.org/packages/mainline/centos/$releasever/$basearch/
gpgcheck=1
enabled=0
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
```

### Install
Nginxをインストールします
```
yum-config-manager --enable nginx-mainline
yum install nginx
```

### Check
インストールが完了したか確認します
```
yum list installed | grep nginx
```

### Start
```
systemctl start nginx
```

### Status
```
systemctl status nginx
```

### Auto Start
```
systemctl enable nginx
```

### Auto Start Check
```
systemctl is-enabled nginx
```

### Nginx User Add
Nginxのユーザーとして`www`を作成します
```
useradd -s /sbin/nologin www
passwd www

cat /etc/passwd | grep www
> www:x:1002:1003::/home/www:/sbin/nologin
id www
> uid=1002(www) gid=1003(www) groups=1003(www)
```

### Make Public Directory
公開フォルダーとして使用するフォルダーを作成します
```
cd /home/www
mkdir www.medice-note.vxx0.com
mkdir api.medice-note.vxx0.com
mkdir admin.medice-note.vxx0.com
# パーミッションをwwwユーザーに変更
chown -R www:www /home/www
```

### Make Config Directory
```
# nginxディレクトリに移動し、コンフィグディレクトリーを作成します
cd /etc/nginx
mkdir sites-available
mkdir sites-enabled

# nginx.congを編集します
vi nginx.conf
# 編集するべき箇所は4箇所です
user www;
http {} -> server_tokens off;
http {} -> include sites-enabled/*.conf;
http {} -> server_names_hash_bucket_size 128;
keepalive_timeout 3;
```

### Check Conf
コンフィグファイルがエラーとなっていないかチェックします
```
nginx -t
```

### Virtual Host
```
mv /etc/nginx/conf.d/default.conf /etc/nginx/sites-available/
ls -a /etc/nginx/sites-available/
> . .. default.conf
vi www.medice-note.vxx0.com.conf
vi admin.medice-note.vxx0.com.conf
vi api.medice-note.vxx0.com.conf

ln -s /etc/nginx/sites-available/default.conf /etc/nginx/sites-enabled/default.com.conf
ln -s /etc/nginx/sites-available/www.medice-note.vxx0.com.conf /etc/nginx/sites-enabled/www.medice-note.vxx0.com.conf
ln -s /etc/nginx/sites-available/api.medice-note.vxx0.com.conf /etc/nginx/sites-enabled/api.medice-note.vxx0.com.conf
ln -s /etc/nginx/sites-available/admin.medice-note.vxx0.com.conf /etc/nginx/sites-enabled/admin.medice-note.vxx0.com.conf

ls -a /etc/nginx/sites-enabled/
> . ..
> admin.medice-note.vxx0.com.conf 
> default.com.conf
> api.medice-note.vxx0.com.conf 
> www.medice-note.vxx0.com.conf
```


### Unlink
UnLinkしたい場合は、下記のコマンドを実行します
```
unlink /etc/nginx/sites-enabled/www.medice-note.vxx0.com.conf
```

### Restart
コンフィグファイルの変更を適用するためにnginxを再起動します
```
systemctl restart nginx
```

## PHP
> ***インストール時は最新のドキュメントにしたがってインストールするべきです***

### Remi Repository Add
```
yum -y install http://rpms.famillecollet.com/enterprise/remi-release-7.rpm
```

### Info
`yum info`を実行する必要はありません
```
yum info --enablerepo=remi,remi-php72 php php-mbstring php-xml php-xmlrpc php-gd php-pdo php-pecl-mcrypt php-mysqlnd php-pecl-mysql
```

### Install
PHPをインストールします
```
yum -y install --enablerepo=remi,remi-php72 php php-mbstring php-xml php-xmlrpc php-gd php-pdo php-pecl-mcrypt php-mysqlnd php-pecl-mysql
```


### Check
PHPがインストールされたか確認します
```
yum list installed | grep php
php -v
```

### PHP Config
PHPのコンフィグファイルを編集します
```
vi /etc/php.ini
expose_php = Off
post_max_size = 20M
upload_max_filesize = 20M
date.timezone = "Asia/Tokyo"
mbstring.language = Japanese
mbstring.internal_encoding = UTF-8
mbstring.http_input = UTF-8
mbstring.http_output = pass
mbstring.encoding_translation = On
mbstring.detect_order = auto
mbstring.substitute_character = none
```

### PHP 7.2 fpm
```
yum info --enablerepo=remi,remi-php72 php-fpm
yum -y install --enablerepo=remi,remi-php72 php-fpm
yum list installed | grep php-fpm
```

### Edit Conf
```
vi /etc/php-fpm.d/www.conf

user = www
group = www
pm.max_children = 25
pm.start_servers = 10
pm.min_spare_servers = 10
pm.max_spare_servers = 20
pm.max_requests = 500
```

### systemctl command
```
# Start
systemctl start php-fpm
# Status
systemctl status php-fpm
# Auto Start
systemctl enable php-fpm
# Is Enabled
systemctl is-enabled php-fpm
> enabled
```

```
vi /etc/nginx/sites-available/~.conf
location / {
    index index.php index.html index.htm;
}

location ~ \.php$ {
    fastcgi_pass 127.0.0.1:9000;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
}
```

### Restart Nginx
```
systemctl restart nginx
```

## MariaDB
> ***インストール時は最新のドキュメントにしたがってインストールするべきです***  
> <https://mariadb.com/ja/resources/blog/install-mariadb-server-centos7/>

### Install
```
yum install MariaDB-server
```

### Config
```
vi /etc/my.cnf.d/server.cnf
[mariadb]
character-set-server=utf8
```

### Start
```
systemctl enable mariadb
systemctl start mariadb
```

## SSL
### Certbot install
```
yum -y install certbot
```

### Check
```
which certbot
```

### SSL Certificate issuance
```
ワーキングディレクトリーとドメイン名を指定して発行します
certbot certonly --webroot -w /home/www/www.medice-note.vxx0.com/ -d www.medice-note.vxx0.com
certbot certonly --webroot -w /home/www/api.medice-note.vxx0.com/ -d api.medice-note.vxx0.com
certbot certonly --webroot -w /home/www/admin.medice-note.vxx0.com/ -d admin.medice-note.vxx0.com
Mail -> [Mail Address]
Please read the Terms of Service at -> Agree
Would you be willing to share your email address -> Yes
```

### Check
```
証明書が正しく発行されたら/etc/letsencrypt/live/配下にファイルが生成されます
cd /etc/letsencrypt/live/www.medice-note.vxx0.com
ls
> README cert.pem chain.pem fullchain.pem privkey.pem
```

### dhparam
```
mkdir /etc/nginx/ssl
openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
ls -a /etc/nginx/ssl/
```

### Config Edit
```
vi /etc/nginx/sites-available/www.medice-note.vxx0.com
```

### restart
```
nginx -t
systemctl restart nginx
```

## NodeJS Install
```
curl -sL https://rpm.nodesource.com/setup_14.x | bash -
yum install nodejs
npm install
```

### Forever Install
```
npm install forever -g
```
