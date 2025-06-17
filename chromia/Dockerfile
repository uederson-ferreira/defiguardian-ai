# Chromia Real Node Dockerfile
FROM eclipse-temurin:17-jdk-alpine

# Informações do container
LABEL maintainer="RiskGuardian Team"
LABEL description="Chromia/Postchain Node for RiskGuardian DeFi Analytics"
LABEL version="1.0.0"

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache \
    curl \
    wget \
    bash \
    postgresql-client \
    && rm -rf /var/cache/apk/*

# Criar usuário para o serviço
RUN addgroup -g 1000 chromia && \
    adduser -u 1000 -G chromia -s /bin/bash -D chromia

# Definir versão do Postchain
ENV POSTCHAIN_VERSION=4.7.2
ENV POSTCHAIN_JAR_URL=https://github.com/chromaway/postchain/releases/download/v${POSTCHAIN_VERSION}/postchain-${POSTCHAIN_VERSION}.jar

# Baixar Postchain JAR
RUN wget -O postchain.jar ${POSTCHAIN_JAR_URL} || \
    curl -L -o postchain.jar ${POSTCHAIN_JAR_URL}

# Baixar driver PostgreSQL
RUN wget -O postgresql.jar https://jdbc.postgresql.org/download/postgresql-42.7.1.jar

# Verificar se os JARs foram baixados
RUN ls -la *.jar

# Copiar configurações e scripts
COPY config/ ./config/
COPY src/ ./src/
COPY wait-for-postgres.sh ./
COPY start-chromia.sh ./

# Tornar scripts executáveis
RUN chmod +x wait-for-postgres.sh start-chromia.sh

# Criar diretórios necessários
RUN mkdir -p data logs config/local

# Configurar variáveis de ambiente
ENV JAVA_OPTS="-Xmx2g -Xms1g"
ENV POSTCHAIN_CONFIG_FILE="/app/config/node-config.properties"
ENV POSTGRES_HOST=postgres
ENV POSTGRES_PORT=5432
ENV POSTGRES_DB=chromia
ENV POSTGRES_USER=chromia
ENV POSTGRES_PASSWORD=chromia_password

# Configurar classpath
ENV CLASSPATH="/app/postchain.jar:/app/postgresql.jar:$CLASSPATH"

# Expor portas
EXPOSE 7740 7741

# Configurar propriedade do usuário
RUN chown -R chromia:chromia /app

# Mudar para usuário chromia
USER chromia

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:7740/api/v1/node/info || exit 1

# Comando de inicialização
CMD ["./start-chromia.sh"] 