FROM centos:7

RUN yum -y update
RUN yum install -y gcc gcc-c++ curl-devel expat-devel gettext-devel openssl-devel zlib-devel perl-ExtUtils-MakeMaker autoconf wget make

# nginx
COPY ./nginx.repo /etc/yum.repos.d/nginx.repo
RUN yum install -y nginx
COPY ./default.conf /etc/nginx/conf.d/default.conf

# mariadb
RUN yum install -y mariadb-server
#CMD ["/usr/bin/mysqld_safe", "--skip-grant-tables"]

# git
WORKDIR /usr/local/src
RUN wget https://mirrors.edge.kernel.org/pub/software/scm/git/git-2.27.0.tar.gz
RUN tar xzvf ./git-2.27.0.tar.gz
RUN rm -rf ./git-2.27.0.tar.gz
WORKDIR ./git-2.27.0
RUN make prefix=/usr/local all
RUN make prefix=/usr/local install
RUN rm -rf /usr/local/src/git-2.27.0
WORKDIR /

# nodejs
RUN curl -sL https://rpm.nodesource.com/setup_12.x | bash -
RUN yum install -y nodejs

# forever
RUN npm install -g forever

# app
RUN mkdir /home/user
WORKDIR /home/user
RUN git clone -b dev_stisla https://github.com/ASO1701001/medice-note.git
WORKDIR ./medice-note
COPY ./config.json ./config.json
RUN npm install
#RUN forever start index.js
