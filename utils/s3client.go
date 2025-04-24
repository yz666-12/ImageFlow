package utils

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var (
	S3Client *s3.Client
	s3Bucket string
)

func InitS3Client(cfg *config.Config) error {
	log.Printf("Initializing S3 client with endpoint: %s", cfg.S3Endpoint)

	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL: cfg.S3Endpoint,
		}, nil
	})

	awsCfg, err := awsconfig.LoadDefaultConfig(context.TODO(),
		awsconfig.WithRegion(cfg.S3Region),
		awsconfig.WithEndpointResolverWithOptions(customResolver),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.S3AccessKey,
			cfg.S3SecretKey,
			"",
		)),
	)
	if err != nil {
		return fmt.Errorf("unable to load SDK config: %v", err)
	}

	S3Client = s3.NewFromConfig(awsCfg)
	s3Bucket = cfg.S3Bucket
	log.Printf("S3 client initialized successfully for bucket: %s", s3Bucket)
	return nil
}

func UploadToS3(ctx context.Context, key string, data []byte) error {
	_, err := S3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(s3Bucket),
		Key:    aws.String(key),
		Body:   bytes.NewReader(data),
	})
	return err
}

func GetFromS3(ctx context.Context, key string) ([]byte, error) {
	result, err := S3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s3Bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}
	defer result.Body.Close()

	return io.ReadAll(result.Body)
}
