# Server Setup
### Google Cloud Platform Compute Engine(CentOS 7 Install)
[Install Document](centos/index.md)

### Docker
> ***Dockerはテスト環境として使用します*** 

[Install Document](docker/index.md)

# Maintenance
### SSL Certificate Renew
```
certbot certonly --webroot -w /home/www/www.medice-note.vxx0.com/ -d www.medice-note.vxx0.com --renew-by-default
certbot certonly --webroot -w /home/www/api.medice-note.vxx0.com/ -d api.medice-note.vxx0.com --renew-by-default
certbot certonly --webroot -w /home/www/admin.medice-note.vxx0.com/ -d admin.medice-note.vxx0.com --renew-by-default
```
