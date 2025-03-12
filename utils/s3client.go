package utils

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var S3Client *s3.Client

func InitS3Client() error {
	log.Printf("Initializing S3 client with endpoint: %s", os.Getenv("S3_ENDPOINT"))

	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL: os.Getenv("S3_ENDPOINT"),
		}, nil
	})

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(os.Getenv("S3_REGION")),
		config.WithEndpointResolverWithOptions(customResolver),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			os.Getenv("S3_ACCESS_KEY"),
			os.Getenv("S3_SECRET_KEY"),
			"",
		)),
	)
	if err != nil {
		return fmt.Errorf("unable to load SDK config: %v", err)
	}

	S3Client = s3.NewFromConfig(cfg)
	log.Printf("S3 client initialized successfully for bucket: %s", os.Getenv("S3_BUCKET"))
	return nil
}

func UploadToS3(ctx context.Context, key string, data []byte) error {
	_, err := S3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(os.Getenv("S3_BUCKET")),
		Key:    aws.String(key),
		Body:   bytes.NewReader(data),
	})
	return err
}

func GetFromS3(ctx context.Context, key string) ([]byte, error) {
	result, err := S3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(os.Getenv("S3_BUCKET")),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}
	defer result.Body.Close()

	return io.ReadAll(result.Body)
}
